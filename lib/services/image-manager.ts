/**
 * Image Manager Service
 * 
 * Handles image upload, processing, validation, and management for knowledge graph nodes.
 * Supports multiple formats, compression, and metadata extraction.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

/**
 * Supported image formats
 */
export interface ImageFormat {
  extension: string;
  mimeType: string;
  maxSize: number; // in bytes
  description: string;
}

/**
 * Image upload options
 */
export interface ImageUploadOptions {
  maxSize?: number; // bytes
  quality?: number; // 0-1
  resize?: { width?: number; height?: number };
  format?: 'webp' | 'jpeg' | 'png';
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  url: string;
  filename: string;
  originalFilename: string;
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  mimeType: string;
  uploadedAt: Date;
  checksum: string;
  thumbnailUrl?: string;
  exifData?: Record<string, any>;
}

/**
 * Image upload result
 */
export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  metadata?: ImageMetadata;
  error?: string;
  warnings?: string[];
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  resize?: { width?: number; height?: number };
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  removeExif?: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
}

/**
 * Processed image result
 */
export interface ProcessedImage {
  success: boolean;
  processedUrl?: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  metadata?: ImageMetadata;
  error?: string;
}
/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    code: string;
    message: string;
    impact: string;
  }>;
}

/**
 * Image association result
 */
export interface AssociationResult {
  success: boolean;
  nodeId: string;
  imageUrl: string;
  previousImageUrl?: string;
  message?: string;
}

/**
 * Image removal result
 */
export interface RemovalResult {
  success: boolean;
  nodeId: string;
  removedImageUrl: string;
  backupUrl?: string;
  message?: string;
}

/**
 * Image Manager Service interface
 */
export interface ImageManagerService {
  /**
   * Upload image with validation and processing
   */
  uploadImage(file: File, options?: ImageUploadOptions): Promise<ImageUploadResult>;

  /**
   * Associate image with node
   */
  associateImageWithNode(nodeId: string, imageUrl: string): Promise<AssociationResult>;

  /**
   * Remove image from node
   */
  removeImageFromNode(nodeId: string): Promise<RemovalResult>;

  /**
   * Get image metadata and preview
   */
  getImageMetadata(imageUrl: string): Promise<ImageMetadata | null>;

  /**
   * Compress and optimize image
   */
  processImage(file: File, options: ImageProcessingOptions): Promise<ProcessedImage>;

  /**
   * Validate image file
   */
  validateImageFile(file: File): ImageValidationResult;

  /**
   * Get supported image formats
   */
  getSupportedFormats(): ImageFormat[];

  /**
   * Generate thumbnail for image
   */
  generateThumbnail(imageUrl: string, size?: { width: number; height: number }): Promise<string>;

  /**
   * Get image statistics
   */
  getImageStatistics(): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    formatDistribution: Record<string, number>;
  }>;

  /**
   * Cleanup unused images
   */
  cleanupUnusedImages(): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }>;

  /**
   * Batch upload images
   */
  batchUploadImages(files: File[], options?: ImageUploadOptions): Promise<{
    results: ImageUploadResult[];
    successCount: number;
    failureCount: number;
  }>;
}
/**
 * Implementation of Image Manager Service
 */
export class ImageManagerServiceImpl implements ImageManagerService {
  private supportedFormats: ImageFormat[] = [
    {
      extension: 'jpg',
      mimeType: 'image/jpeg',
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'JPEG图像格式'
    },
    {
      extension: 'jpeg',
      mimeType: 'image/jpeg',
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'JPEG图像格式'
    },
    {
      extension: 'png',
      mimeType: 'image/png',
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'PNG图像格式'
    },
    {
      extension: 'webp',
      mimeType: 'image/webp',
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'WebP图像格式'
    },
    {
      extension: 'gif',
      mimeType: 'image/gif',
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'GIF图像格式'
    }
  ];

  private defaultUploadOptions: ImageUploadOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    quality: 0.8,
    format: 'webp',
    generateThumbnail: true,
    thumbnailSize: { width: 200, height: 200 }
  };

  /**
   * Upload image with validation and processing
   */
  async uploadImage(file: File, options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    const uploadOptions = { ...this.defaultUploadOptions, ...options };

    try {
      // Validate the file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', '),
          warnings: validation.warnings.map(w => w.message)
        };
      }

      // Process the image
      const processedImage = await this.processImage(file, {
        resize: uploadOptions.resize,
        quality: uploadOptions.quality,
        format: uploadOptions.format,
        removeExif: true
      });

      if (!processedImage.success) {
        return {
          success: false,
          error: processedImage.error || '图像处理失败'
        };
      }

      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (uploadOptions.generateThumbnail && processedImage.processedUrl) {
        try {
          thumbnailUrl = await this.generateThumbnail(
            processedImage.processedUrl,
            uploadOptions.thumbnailSize
          );
        } catch (error) {
          console.warn('[Image Manager] Failed to generate thumbnail:', error);
        }
      }

      // Create metadata
      const metadata: ImageMetadata = {
        url: processedImage.processedUrl!,
        filename: this.generateFilename(file.name, uploadOptions.format),
        originalFilename: file.name,
        size: processedImage.processedSize,
        dimensions: await this.getImageDimensions(processedImage.processedUrl!),
        format: uploadOptions.format || this.getFileExtension(file.name),
        mimeType: this.getMimeType(uploadOptions.format || this.getFileExtension(file.name)),
        uploadedAt: new Date(),
        checksum: await this.calculateChecksum(file),
        thumbnailUrl,
        exifData: {} // EXIF data removed for privacy
      };

      // Save metadata to database
      await this.saveImageMetadata(metadata);

      return {
        success: true,
        imageUrl: processedImage.processedUrl,
        thumbnailUrl,
        metadata,
        warnings: validation.warnings.map(w => w.message)
      };
    } catch (error) {
      console.error('[Image Manager] Error uploading image:', error);
      return {
        success: false,
        error: `图像上传失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Associate image with node
   */
  async associateImageWithNode(nodeId: string, imageUrl: string): Promise<AssociationResult> {
    try {
      // Validate that the image exists
      const metadata = await this.getImageMetadata(imageUrl);
      if (!metadata) {
        return {
          success: false,
          nodeId,
          imageUrl,
          message: '图像不存在'
        };
      }

      // Get current image association
      const currentAssociation = await this.getNodeImageAssociation(nodeId);
      
      // Update node image association
      await this.updateNodeImageAssociation(nodeId, imageUrl);

      return {
        success: true,
        nodeId,
        imageUrl,
        previousImageUrl: currentAssociation?.imageUrl,
        message: '图像关联成功'
      };
    } catch (error) {
      console.error('[Image Manager] Error associating image with node:', error);
      return {
        success: false,
        nodeId,
        imageUrl,
        message: `关联失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Remove image from node
   */
  async removeImageFromNode(nodeId: string): Promise<RemovalResult> {
    try {
      // Get current image association
      const currentAssociation = await this.getNodeImageAssociation(nodeId);
      
      if (!currentAssociation) {
        return {
          success: false,
          nodeId,
          removedImageUrl: '',
          message: '节点没有关联的图像'
        };
      }

      // Create backup reference
      const backupUrl = await this.createImageBackup(currentAssociation.imageUrl);

      // Remove association
      await this.removeNodeImageAssociation(nodeId);

      return {
        success: true,
        nodeId,
        removedImageUrl: currentAssociation.imageUrl,
        backupUrl,
        message: '图像移除成功'
      };
    } catch (error) {
      console.error('[Image Manager] Error removing image from node:', error);
      return {
        success: false,
        nodeId,
        removedImageUrl: '',
        message: `移除失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Get image metadata and preview
   */
  async getImageMetadata(imageUrl: string): Promise<ImageMetadata | null> {
    try {
      // This would query the database for image metadata
      const metadata = await this.findImageMetadata(imageUrl);
      return metadata;
    } catch (error) {
      console.error('[Image Manager] Error getting image metadata:', error);
      return null;
    }
  }

  /**
   * Compress and optimize image
   */
  async processImage(file: File, options: ImageProcessingOptions): Promise<ProcessedImage> {
    try {
      const originalSize = file.size;

      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }

      // Load image
      const img = await this.loadImage(file);
      
      // Calculate dimensions
      let { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        options.resize
      );

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Add watermark if specified
      if (options.watermark) {
        this.addWatermark(ctx, canvas, options.watermark);
      }

      // Convert to blob
      const quality = options.quality || 0.8;
      const format = options.format || 'webp';
      const mimeType = this.getMimeType(format);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图像转换失败'));
            }
          },
          mimeType,
          quality
        );
      });

      // Upload processed image
      const processedUrl = await this.uploadProcessedImage(blob, file.name, format);
      const processedSize = blob.size;
      const compressionRatio = originalSize / processedSize;

      return {
        success: true,
        processedUrl,
        originalSize,
        processedSize,
        compressionRatio
      };
    } catch (error) {
      console.error('[Image Manager] Error processing image:', error);
      return {
        success: false,
        originalSize: file.size,
        processedSize: 0,
        compressionRatio: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): ImageValidationResult {
    const errors: Array<{
      code: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];
    const warnings: Array<{
      code: string;
      message: string;
      impact: string;
    }> = [];

    // Check file type
    const extension = this.getFileExtension(file.name);
    const supportedFormat = this.supportedFormats.find(
      format => format.extension === extension || format.mimeType === file.type
    );

    if (!supportedFormat) {
      errors.push({
        code: 'UNSUPPORTED_FORMAT',
        message: `不支持的图像格式: ${extension}`,
        severity: 'error'
      });
    }

    // Check file size
    if (supportedFormat && file.size > supportedFormat.maxSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `文件大小超过限制 (${this.formatFileSize(supportedFormat.maxSize)})`,
        severity: 'error'
      });
    }

    // Check for very small files
    if (file.size < 1024) { // Less than 1KB
      warnings.push({
        code: 'FILE_TOO_SMALL',
        message: '文件大小过小，可能是无效图像',
        impact: '可能导致显示问题'
      });
    }

    // Check for very large files (warning)
    if (file.size > 2 * 1024 * 1024) { // Larger than 2MB
      warnings.push({
        code: 'LARGE_FILE_SIZE',
        message: '文件较大，建议压缩后上传',
        impact: '可能影响加载速度'
      });
    }

    // Check filename
    if (file.name.length > 255) {
      errors.push({
        code: 'FILENAME_TOO_LONG',
        message: '文件名过长',
        severity: 'error'
      });
    }

    // Check for special characters in filename
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      warnings.push({
        code: 'SPECIAL_CHARACTERS',
        message: '文件名包含特殊字符',
        impact: '可能导致兼容性问题'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): ImageFormat[] {
    return [...this.supportedFormats];
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(imageUrl: string, size: { width: number; height: number } = { width: 200, height: 200 }): Promise<string> {
    try {
      // Load the original image
      const img = await this.loadImageFromUrl(imageUrl);
      
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }

      // Calculate thumbnail dimensions (maintain aspect ratio)
      const { width, height } = this.calculateThumbnailDimensions(
        img.width,
        img.height,
        size.width,
        size.height
      );

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('缩略图生成失败'));
            }
          },
          'image/webp',
          0.8
        );
      });

      // Upload thumbnail
      const thumbnailUrl = await this.uploadThumbnail(blob, imageUrl);
      return thumbnailUrl;
    } catch (error) {
      console.error('[Image Manager] Error generating thumbnail:', error);
      throw error;
    }
  }
  /**
   * Get image statistics
   */
  async getImageStatistics(): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    formatDistribution: Record<string, number>;
  }> {
    try {
      const [totalImages, totalSize, formatDistribution] = await Promise.all([
        this.countTotalImages(),
        this.calculateTotalSize(),
        this.getFormatDistribution()
      ]);

      const averageSize = totalImages > 0 ? totalSize / totalImages : 0;

      return {
        totalImages,
        totalSize,
        averageSize,
        formatDistribution
      };
    } catch (error) {
      console.error('[Image Manager] Error getting statistics:', error);
      throw new Error(`获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cleanup unused images
   */
  async cleanupUnusedImages(): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }> {
    const result = {
      deletedCount: 0,
      freedSpace: 0,
      errors: [] as string[]
    };

    try {
      // Find unused images
      const unusedImages = await this.findUnusedImages();

      for (const imageUrl of unusedImages) {
        try {
          const metadata = await this.getImageMetadata(imageUrl);
          if (metadata) {
            await this.deleteImage(imageUrl);
            result.deletedCount++;
            result.freedSpace += metadata.size;
          }
        } catch (error) {
          result.errors.push(`删除图像 ${imageUrl} 失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return result;
    } catch (error) {
      console.error('[Image Manager] Error during cleanup:', error);
      result.errors.push(`清理过程失败: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Batch upload images
   */
  async batchUploadImages(files: File[], options: ImageUploadOptions = {}): Promise<{
    results: ImageUploadResult[];
    successCount: number;
    failureCount: number;
  }> {
    const results: ImageUploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, options);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          error: `上传 ${file.name} 失败: ${error instanceof Error ? error.message : String(error)}`
        });
        failureCount++;
      }
    }

    return {
      results,
      successCount,
      failureCount
    };
  }
  // Private helper methods

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private getMimeType(format: string): string {
    const formatMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return formatMap[format] || 'image/jpeg';
  }

  private generateFilename(originalName: string, format?: string): string {
    const timestamp = Date.now();
    const extension = format || this.getFileExtension(originalName);
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    return `${baseName}_${timestamp}.${extension}`;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图像加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  private async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图像加载失败'));
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    resize?: { width?: number; height?: number }
  ): { width: number; height: number } {
    if (!resize) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (resize.width && resize.height) {
      return { width: resize.width, height: resize.height };
    } else if (resize.width) {
      return { width: resize.width, height: resize.width / aspectRatio };
    } else if (resize.height) {
      return { width: resize.height * aspectRatio, height: resize.height };
    }

    return { width: originalWidth, height: originalHeight };
  }

  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (aspectRatio > 1) {
      // Landscape
      return { width: maxWidth, height: maxWidth / aspectRatio };
    } else {
      // Portrait or square
      return { width: maxHeight * aspectRatio, height: maxHeight };
    }
  }

  private addWatermark(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    watermark: { text: string; position: string; opacity: number }
  ): void {
    ctx.save();
    ctx.globalAlpha = watermark.opacity;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';

    const textMetrics = ctx.measureText(watermark.text);
    const textWidth = textMetrics.width;
    const textHeight = 16;

    let x = 10;
    let y = textHeight + 10;

    switch (watermark.position) {
      case 'top-right':
        x = canvas.width - textWidth - 10;
        y = textHeight + 10;
        break;
      case 'bottom-left':
        x = 10;
        y = canvas.height - 10;
        break;
      case 'bottom-right':
        x = canvas.width - textWidth - 10;
        y = canvas.height - 10;
        break;
      case 'center':
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
        break;
    }

    ctx.fillText(watermark.text, x, y);
    ctx.restore();
  }

  private async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    try {
      const img = await this.loadImageFromUrl(imageUrl);
      return { width: img.width, height: img.height };
    } catch (error) {
      return { width: 0, height: 0 };
    }
  }

  private async calculateChecksum(file: File): Promise<string> {
    // Simple checksum calculation using file size and name
    // In a real implementation, you might use crypto.subtle.digest
    const data = `${file.name}_${file.size}_${file.lastModified}`;
    return btoa(data).substring(0, 16);
  }

  // Database integration methods (these would use actual database in real implementation)

  private async saveImageMetadata(metadata: ImageMetadata): Promise<void> {
    // This would save to database using Prisma
  }

  private async findImageMetadata(imageUrl: string): Promise<ImageMetadata | null> {
    // This would query database for image metadata
    return null;
  }

  private async getNodeImageAssociation(nodeId: string): Promise<{ imageUrl: string } | null> {
    // This would get current image association for node
    return null;
  }

  private async updateNodeImageAssociation(nodeId: string, imageUrl: string): Promise<void> {
    // This would update node's image association
  }

  private async removeNodeImageAssociation(nodeId: string): Promise<void> {
    // This would remove node's image association
  }

  private async createImageBackup(imageUrl: string): Promise<string> {
    // This would create a backup copy of the image
    return `${imageUrl}_backup`;
  }

  private async uploadProcessedImage(blob: Blob, originalName: string, format: string): Promise<string> {
    // This would upload the processed image to storage
    return `https://example.com/images/${this.generateFilename(originalName, format)}`;
  }

  private async uploadThumbnail(blob: Blob, originalUrl: string): Promise<string> {
    // This would upload the thumbnail to storage
    return `${originalUrl}_thumb`;
  }

  private async countTotalImages(): Promise<number> {
    // This would count total images in database
    return 0;
  }

  private async calculateTotalSize(): Promise<number> {
    // This would calculate total size of all images
    return 0;
  }

  private async getFormatDistribution(): Promise<Record<string, number>> {
    // This would get distribution of image formats
    return {};
  }

  private async findUnusedImages(): Promise<string[]> {
    // This would find images not associated with any nodes
    return [];
  }

  private async deleteImage(imageUrl: string): Promise<void> {
    // This would delete image from storage and database
  }
}

/**
 * Factory function to create Image Manager Service instance
 */
export function createImageManagerService(): ImageManagerService {
  return new ImageManagerServiceImpl();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: ImageManagerService | null = null;

export function getImageManagerService(): ImageManagerService {
  if (!defaultInstance) {
    defaultInstance = createImageManagerService();
  }
  return defaultInstance;
}