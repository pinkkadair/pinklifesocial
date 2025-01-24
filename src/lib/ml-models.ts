import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { createDetector, SupportedModels, FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';
import { logger } from './logger';

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

class MLModelManager {
  private static instance: MLModelManager;
  private models: MLModels = {};
  private isLoading = false;
  private loadPromise?: Promise<MLModels>;

  private constructor() {}

  static getInstance(): MLModelManager {
    if (!MLModelManager.instance) {
      MLModelManager.instance = new MLModelManager();
    }
    return MLModelManager.instance;
  }

  async loadModels(): Promise<MLModels> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise(async (resolve, reject) => {
      if (this.isLoading) {
        return;
      }

      try {
        this.isLoading = true;
        logger.info('Loading ML models...');

        await tf.ready();
        logger.info('TensorFlow.js ready');

        const [faceDetector, faceLandmarks] = await Promise.all([
          blazeface.load().then(model => {
            logger.info('Face detector loaded');
            return model;
          }),
          createDetector(SupportedModels.MediaPipeFaceMesh, {
            runtime: 'tfjs',
            maxFaces: 1,
            refineLandmarks: true,
          }).then(model => {
            logger.info('Face landmarks detector loaded');
            return model;
          })
        ]);

        this.models = { faceDetector, faceLandmarks };
        logger.info('All ML models loaded successfully');
        resolve(this.models);
      } catch (error) {
        logger.error('Failed to load ML models:', error as Error);
        reject(error);
      } finally {
        this.isLoading = false;
      }
    });

    return this.loadPromise;
  }

  async detectFace(imageData: ImageData): Promise<Face | null> {
    try {
      if (!this.models.faceDetector) {
        throw new Error('Face detector not loaded');
      }

      const tensor = tf.browser.fromPixels(imageData);
      const predictions = await this.models.faceDetector.estimateFaces(tensor, false);
      tensor.dispose();

      if (predictions.length === 0) {
        return null;
      }

      const prediction = predictions[0] as blazeface.NormalizedFace;
      const landmarks = prediction.landmarks;
      const topLeft = prediction.topLeft;
      const bottomRight = prediction.bottomRight;

      if (!landmarks || !topLeft || !bottomRight || !Array.isArray(landmarks)) {
        throw new Error('Invalid face detection result');
      }

      // Ensure landmarks is an array of Point2D
      const typedLandmarks = landmarks as Point2D[];
      const typedTopLeft = topLeft as Point2D;
      const typedBottomRight = bottomRight as Point2D;

      return {
        keypoints: typedLandmarks.map((point): FaceLandmark => ({
          x: point[0],
          y: point[1],
        })),
        box: {
          xMin: typedTopLeft[0],
          yMin: typedTopLeft[1],
          xMax: typedBottomRight[0],
          yMax: typedBottomRight[1],
        },
      };
    } catch (error) {
      logger.error('Face detection failed:', error as Error);
      throw error;
    }
  }

  async detectLandmarks(imageData: ImageData): Promise<LandmarkResult | null> {
    try {
      if (!this.models.faceLandmarks) {
        throw new Error('Face landmarks detector not loaded');
      }

      const tensor = tf.browser.fromPixels(imageData);
      const predictions = await this.models.faceLandmarks.estimateFaces(tensor);
      tensor.dispose();

      if (predictions.length === 0) {
        return null;
      }

      const landmarks = predictions[0].keypoints;
      const boundingBox = predictions[0].box;

      return {
        positions: landmarks.map(point => [point.x, point.y, point.z || 0]),
        box: {
          xMin: boundingBox.xMin,
          yMin: boundingBox.yMin,
          xMax: boundingBox.xMax,
          yMax: boundingBox.yMax,
        },
      };
    } catch (error) {
      logger.error('Landmark detection failed:', error as Error);
      throw error;
    }
  }

  async analyzeSkinTexture(imageData: ImageData, face: Face): Promise<number> {
    let tensors: tf.Tensor[] = [];
    try {
      const tensor = tf.browser.fromPixels(imageData);
      tensors.push(tensor);

      // Convert to proper shape for analysis
      const reshapedTensor = tensor.reshape([1, tensor.shape[0], tensor.shape[1], tensor.shape[2]]);
      tensors.push(reshapedTensor);

      // Extract face region and analyze texture
      const grayScale = tf.image.rgbToGrayscale(reshapedTensor);
      tensors.push(grayScale);

      const normalized = tf.div(grayScale, 255);
      tensors.push(normalized);
      
      // Calculate local variance as a measure of texture
      const poolSize = 3;
      const variance = tf.pool(
        normalized,
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
      const reshapedTensor = tensor.reshape([1, tensor.shape[0], tensor.shape[1], tensor.shape[2]]);
      tensors.push(reshapedTensor);

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

export const mlManager = MLModelManager.getInstance(); 