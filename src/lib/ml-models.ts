import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { createDetector, SupportedModels, FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';
import { logger } from './logger';
import type { Tensor3D } from '@tensorflow/tfjs';

export interface MLModels {
  faceDetector?: blazeface.BlazeFaceModel;
  faceLandmarks?: FaceLandmarksDetector;
}

export interface Face {
  keypoints: FaceLandmark[];
  box: BoundingBox;
}

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface LandmarkResult {
  positions: number[][];
  box: BoundingBox;
}

type Point2D = [number, number];

class MLManager {
  private static instance: MLManager;
  private faceDetectionModel: blazeface.BlazeFaceModel | null = null;
  private featureExtractionModel: FaceLandmarksDetector | null = null;
  private modelLoadingPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor to enforce singleton
    tf.enableProdMode(); // Enable production mode for better performance
    tf.env().set('WEBGL_PACK', true); // Enable WebGL packing for better GPU utilization
  }

  public static getInstance(): MLManager {
    if (!MLManager.instance) {
      MLManager.instance = new MLManager();
    }
    return MLManager.instance;
  }

  private async initializeWebGL(): Promise<void> {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      logger.info('WebGL backend initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebGL backend:', error);
      throw error;
    }
  }

  public async loadFaceDetectionModel(): Promise<void> {
    if (this.faceDetectionModel) return;

    try {
      this.faceDetectionModel = await blazeface.load({
        maxFaces: 1,
        inputWidth: 224,
        inputHeight: 224,
        iouThreshold: 0.3,
        scoreThreshold: 0.75,
      });
      logger.info('Face detection model loaded successfully');
    } catch (error) {
      logger.error('Failed to load face detection model:', error);
      throw error;
    }
  }

  public async loadFeatureExtractionModel(): Promise<void> {
    if (this.featureExtractionModel) return;

    try {
      this.featureExtractionModel = await createDetector(
        SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          maxFaces: 1,
          refineLandmarks: true,
        }
      );
      logger.info('Feature extraction model loaded successfully');
    } catch (error) {
      logger.error('Failed to load feature extraction model:', error);
      throw error;
    }
  }

  public async loadModels(): Promise<void> {
    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = (async () => {
      try {
        await this.initializeWebGL();
        await Promise.all([
          this.loadFaceDetectionModel(),
          this.loadFeatureExtractionModel()
        ]);
      } catch (error) {
        this.modelLoadingPromise = null;
        throw error;
      }
    })();

    return this.modelLoadingPromise;
  }

  public async detectFace(imageData: ImageData): Promise<blazeface.NormalizedFace | null> {
    if (!this.faceDetectionModel) {
      throw new Error('Face detection model not loaded');
    }

    try {
      const tensor = tf.browser.fromPixels(imageData);
      const predictions = await this.faceDetectionModel.estimateFaces(tensor, false);
      tensor.dispose();

      return predictions[0] || null;
    } catch (error) {
      logger.error('Face detection failed:', error);
      throw error;
    }
  }

  public async extractFeatures(imageData: ImageData): Promise<any[]> {
    if (!this.featureExtractionModel) {
      throw new Error('Feature extraction model not loaded');
    }

    try {
      const predictions = await this.featureExtractionModel.estimateFaces(imageData);
      return predictions;
    } catch (error) {
      logger.error('Feature extraction failed:', error);
      throw error;
    }
  }

  public disposeModels(): void {
    try {
      if (this.faceDetectionModel) {
        // Dispose of any tensors associated with the model
        const modelTensors = tf.memory().numTensors;
        this.faceDetectionModel = null;
        const afterTensors = tf.memory().numTensors;
        logger.info(`Disposed ${modelTensors - afterTensors} tensors from face detection model`);
      }
      
      if (this.featureExtractionModel) {
        // Clean up feature extraction model
        this.featureExtractionModel = null;
      }
      
      // Force garbage collection of any remaining tensors
      tf.disposeVariables();
      this.modelLoadingPromise = null;
      
      logger.info('Models disposed successfully');
    } catch (error) {
      logger.error('Error disposing models:', error);
    }
  }

  async analyzeSkinTexture(imageData: ImageData, face: Face): Promise<number> {
    let tensors: tf.Tensor[] = [];
    try {
      const tensor = tf.browser.fromPixels(imageData);
      tensors.push(tensor);

      const processedTensor = tf.tidy(() => {
        // Check tensor shape
        if (tensor.shape.length !== 3) {
          throw new Error('Expected a 3D tensor with shape [height, width, channels]');
        }
        
        // Create a new 3D tensor with explicit dimensions
        const [height, width] = tensor.shape;
        return tf.tensor3d(
          Array.from(tensor.dataSync()),
          [height, width, 3],
          'float32'
        ).div(255);
      }) as tf.Tensor3D;

      // Now we can safely use it for grayscale conversion
      const grayScale = tf.image.rgbToGrayscale(processedTensor);
      tensors.push(grayScale);

      const normalized = tf.div(grayScale, 255) as tf.Tensor3D;
      tensors.push(normalized);
      
      // Calculate local variance as a measure of texture
      const poolSize = 3;
      const variance = tf.pool(
        normalized as tf.Tensor3D, // Safe to cast here since we know the shape
        [poolSize, poolSize],
        'avg',
        'valid',
        1
      );
      tensors.push(variance);
      
      const score = tf.mean(variance).dataSync()[0];
      return score * 100;
    } catch (error) {
      logger.error('Texture analysis failed:', error as Error);
      throw error;
    } finally {
      // Clean up all tensors
      tensors.forEach(t => t.dispose());
    }
  }

  async analyzeSkinTone(imageData: ImageData, face: Face): Promise<number> {
    let tensors: tf.Tensor[] = [];
    try {
      const tensor = tf.browser.fromPixels(imageData);
      tensors.push(tensor);

      // Convert to proper shape for analysis
      const reshapedTensor = tf.tidy(() => {
        const resized = tf.image.resizeBilinear(tensor as tf.Tensor3D, [224, 224]);
        return resized;
      });
      const grayScale = tf.image.rgbToGrayscale(reshapedTensor);
      tensors.push(grayScale);

      // Convert to LAB color space for better skin tone analysis
      const lab = tf.tidy(() => {
        const rgb = tf.div(reshapedTensor, 255);
        tensors.push(rgb);
        // Simplified RGB to LAB conversion
        const l = tf.add(tf.mul(rgb.slice([0,0,0], [-1,-1,1]), 0.2989),
                        tf.add(tf.mul(rgb.slice([0,0,1], [-1,-1,1]), 0.5870),
                              tf.mul(rgb.slice([0,0,2], [-1,-1,1]), 0.1140)));
        return l;
      });
      tensors.push(lab);
      
      const score = tf.mean(lab).dataSync()[0];
      return score * 100;
    } catch (error) {
      logger.error('Skin tone analysis failed:', error as Error);
      throw error;
    } finally {
      // Clean up all tensors
      tensors.forEach(t => t.dispose());
    }
  }
}

export const mlManager = MLManager.getInstance(); 