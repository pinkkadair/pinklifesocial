import * as tf from '@tensorflow/tfjs';
import { Face } from './ml-models';
import { logger } from './logger';

export interface SkinAnalysisResult {
  hydration: number;
  elasticity: number;
  texture: number;
  pores: number;
  wrinkles: number;
  spots: number;
  uniformity: number;
  brightness: number;
}

async function analyzeTexture(tensor: tf.Tensor3D): Promise<number> {
  const grayscale = tf.tidy(() => {
    const expanded = tensor.expandDims(0) as tf.Tensor4D;
    return tf.image.rgbToGrayscale(expanded).squeeze([0, -1]) as tf.Tensor2D;
  });
  
  try {
    const normalized = tf.div(grayscale, 255);
    const variance = tf.moments(normalized).variance as tf.Scalar;
    return variance.dataSync()[0] * 100;
  } finally {
    grayscale.dispose();
  }
}

export async function analyzeSkinFeatures(imageData: ImageData, face: Face): Promise<SkinAnalysisResult> {
  let tensors: tf.Tensor[] = [];
  try {
    const tensor = tf.browser.fromPixels(imageData);
    tensors.push(tensor);

    // Extract face region
    const { xMin, yMin, xMax, yMax } = face.box;
    const faceRegion = tensor.slice(
      [Math.max(0, Math.floor(yMin)), Math.max(0, Math.floor(xMin)), 0],
      [Math.floor(yMax - yMin), Math.floor(xMax - xMin), 3]
    ) as tf.Tensor3D;
    tensors.push(faceRegion);

    // Analyze different skin features
    const [
      hydrationScore,
      elasticityScore,
      textureScore,
      poresScore,
      wrinklesScore,
      spotsScore,
      uniformityScore,
      brightnessScore
    ] = await Promise.all([
      analyzeHydration(faceRegion),
      analyzeElasticity(faceRegion),
      analyzeTexture(faceRegion),
      analyzePores(faceRegion),
      analyzeWrinkles(faceRegion),
      analyzeSpots(faceRegion),
      analyzeUniformity(faceRegion),
      analyzeBrightness(faceRegion)
    ]);

    return {
      hydration: hydrationScore,
      elasticity: elasticityScore,
      texture: textureScore,
      pores: poresScore,
      wrinkles: wrinklesScore,
      spots: spotsScore,
      uniformity: uniformityScore,
      brightness: brightnessScore
    };
  } catch (error) {
    logger.error('Skin feature analysis failed:', error as Error);
    throw error;
  } finally {
    tensors.forEach(t => t.dispose());
  }
}

async function analyzeHydration(tensor: tf.Tensor3D): Promise<number> {
  // Analyze skin hydration using color and texture patterns
  const expanded = tensor.expandDims(0) as tf.Tensor4D;
  const grayscale = tf.image.rgbToGrayscale(expanded);
  const normalized = tf.div(grayscale, 255);
  const score = tf.mean(normalized).dataSync()[0];
  return Math.min(Math.max(score * 150, 0), 100);
}

async function analyzeElasticity(tensor: tf.Tensor3D): Promise<number> {
  // Analyze skin elasticity using edge detection and texture analysis
  const edges = tf.tidy(() => {
    const expanded = tensor.expandDims(0) as tf.Tensor4D;
    const gray = tf.image.rgbToGrayscale(expanded);
    const sobelXKernel = tf.tensor4d(
      new Float32Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]).map(x => x / 8),
      [3, 3, 1, 1]
    );
    const sobelYKernel = tf.tensor4d(
      new Float32Array([-1, -2, -1, 0, 0, 0, 1, 2, 1]).map(x => x / 8),
      [3, 3, 1, 1]
    );
    const sobelX = tf.conv2d(gray, sobelXKernel, 1, 'same');
    const sobelY = tf.conv2d(gray, sobelYKernel, 1, 'same');
    return tf.sqrt(tf.add(tf.square(sobelX), tf.square(sobelY)));
  });
  const score = 1 - tf.mean(edges).dataSync()[0];
  edges.dispose();
  return Math.min(Math.max(score * 100, 0), 100);
}

async function analyzePores(tensor: tf.Tensor3D): Promise<number> {
  // Analyze pores using high-frequency components
  const expanded = tensor.expandDims(0) as tf.Tensor4D;
  const grayscale = tf.image.rgbToGrayscale(expanded);
  const blurred = tf.pool(grayscale, [5, 5], 'avg', 'same', 1);
  const highFreq = tf.sub(grayscale, blurred);
  const score = 1 - tf.mean(tf.abs(highFreq)).dataSync()[0];
  return Math.min(Math.max(score * 130, 0), 100);
}

async function analyzeWrinkles(tensor: tf.Tensor3D): Promise<number> {
  // Analyze wrinkles using directional gradients
  const edges = tf.tidy(() => {
    const expanded = tensor.expandDims(0) as tf.Tensor4D;
    const gray = tf.image.rgbToGrayscale(expanded);
    const gradXKernel = tf.tensor4d(
      new Float32Array([-1, 0, 1, -1, 0, 1, -1, 0, 1]).map(x => x / 6),
      [3, 3, 1, 1]
    );
    const gradYKernel = tf.tensor4d(
      new Float32Array([-1, -1, -1, 0, 0, 0, 1, 1, 1]).map(x => x / 6),
      [3, 3, 1, 1]
    );
    const gradX = tf.conv2d(gray, gradXKernel, 1, 'same');
    const gradY = tf.conv2d(gray, gradYKernel, 1, 'same');
    return tf.maximum(tf.abs(gradX), tf.abs(gradY));
  });
  const score = 1 - tf.mean(edges).dataSync()[0];
  edges.dispose();
  return Math.min(Math.max(score * 110, 0), 100);
}

async function analyzeSpots(tensor: tf.Tensor3D): Promise<number> {
  // Analyze spots and pigmentation using color variance
  const rgb = tf.div(tensor, 255);
  const mean = tf.mean(rgb, [0, 1]);
  const variance = tf.mean(tf.square(tf.sub(rgb, mean)));
  const score = 1 - variance.dataSync()[0];
  return Math.min(Math.max(score * 140, 0), 100);
}

async function analyzeUniformity(tensor: tf.Tensor3D): Promise<number> {
  // Analyze skin tone uniformity
  const lab = tf.tidy(() => {
    const rgb = tf.div(tensor, 255);
    const l = tf.add(
      tf.mul(rgb.slice([0,0,0], [-1,-1,1]), 0.2989),
      tf.add(
        tf.mul(rgb.slice([0,0,1], [-1,-1,1]), 0.5870),
        tf.mul(rgb.slice([0,0,2], [-1,-1,1]), 0.1140)
      )
    );
    return l;
  });
  const variance = tf.moments(lab).variance.dataSync()[0];
  const score = 1 - Math.sqrt(variance);
  return Math.min(Math.max(score * 100, 0), 100);
}

async function analyzeBrightness(tensor: tf.Tensor3D): Promise<number> {
  // Analyze skin brightness
  const rgb = tf.div(tensor, 255);
  const brightness = tf.mean(rgb).dataSync()[0];
  return Math.min(Math.max(brightness * 160, 0), 100);
} 