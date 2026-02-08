/**
 * Image Optimizer Utility
 * Resizes and compresses images using HTML5 Canvas before upload.
 */

const ImageOptimizer = {
    /**
     * Compresses an image file.
     * @param {File} file - The image file to compress.
     * @param {Object} options - Compression options.
     * @param {number} [options.maxWidth=1200] - Maximum width.
     * @param {number} [options.maxHeight=1200] - Maximum height.
     * @param {number} [options.quality=0.8] - JPEG/WebP quality (0 to 1).
     * @param {string} [options.mimeType='image/jpeg'] - Output format.
     * @returns {Promise<Blob>} - The compressed image blob.
     */
    compress: function (file, options = {}) {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 0.8,
            mimeType = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round(height * (maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round(width * (maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    // Draw to canvas
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                console.log('ImageOptimizer: Compression successful', { original: file.size, compressed: blob.size });
                                resolve(blob);
                            } else {
                                console.error('ImageOptimizer: Canvas toBlob returned null');
                                reject(new Error('Canvas toBlob failed'));
                            }
                        }, mimeType, quality);
                    } catch (e) {
                        console.error('ImageOptimizer: Error during canvas operations', e);
                        reject(e);
                    }
                };

                img.onerror = (err) => {
                    console.error('ImageOptimizer: Image load error', err);
                    reject(new Error('Failed to load image for compression'));
                };
            };

            reader.onerror = (err) => {
                console.error('ImageOptimizer: FileReader error', err);
                reject(new Error('Failed to read file'));
            };
        });
    }
};

// Expose globally
window.ImageOptimizer = ImageOptimizer;
