import { storageAPI } from './api';

/**
 * Enhanced storage client with composed operations
 * Provides higher-level abstractions over the base storage APIs
 */
export class StorageClient {
  constructor() {
    this.uploadProgress = new Map();
  }

  // ============ Direct API Wrappers ============

  async getContents(folderPath = '') {
    try {
      const response = await storageAPI.getFilesAndFolders(folderPath);
      
      // Handle different response formats
      let data = response;
      if (response && response.data) {
        data = response.data;
      }
      
      // Ensure we have proper structure
      const result = {
        files: [],
        folders: []
      };

      if (data) {
        // If response is a URL (presigned URL), handle differently
        if (typeof data === 'string' && data.includes('http')) {
          console.log('Received presigned URL for folder access:', data);
          // For now, return empty - this might need backend changes
          return {
            success: true,
            data: result
          };
        }

        // Handle array format
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.type === 'folder' || item.directory || !item.name.includes('.')) {
              result.folders.push({
                name: item.name,
                type: 'folder',
                path: item.path || item.name,
                size: item.size || 0,
                lastModified: item.lastModified || item.modifiedDate
              });
            } else {
              result.files.push({
                name: item.name,
                type: 'file',
                path: item.path || item.name,
                size: item.size || 0,
                lastModified: item.lastModified || item.modifiedDate,
                mimeType: item.mimeType || item.contentType
              });
            }
          });
        }
        
        // Handle object format with files and folders properties
        else if (data.files || data.folders) {
          result.files = (data.files || []).map(file => ({
            ...file,
            type: 'file',
            path: file.path || file.name
          }));
          result.folders = (data.folders || []).map(folder => ({
            ...folder,
            type: 'folder',
            path: folder.path || folder.name
          }));
        }
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Failed to load contents:', error);
      // If it's a 404, return empty contents instead of failing
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { files: [], folders: [] }
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load contents'
      };
    }
  }

  async createFolder(folderPath) {
    try {
      const response = await storageAPI.createFolder(folderPath);
      
      // Handle both success formats
      if (response.success || response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        // Handle failed response format
        return {
          success: false,
          error: response.message || 'Failed to create folder',
          validationErrors: response.data
        };
      }
    } catch (error) {
      // Handle API error response format
      if (error.response?.data?.status === 'failed') {
        return {
          success: false,
          error: error.response.data.message || 'Failed to create folder',
          validationErrors: error.response.data.data
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create folder'
      };
    }
  }

  async deleteFile(fileName) {
    try {
      // fileName should be the absolute path from root (e.g., "new_folder/research.pdf")
      console.log('Deleting file with absolute path:', fileName);
      
      const response = await storageAPI.deleteFile(fileName);
      
      // Handle the new API response format
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to delete file'
        };
      }
    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete file'
      };
    }
  }

  async deleteFolder(folderPath) {
    try {
      console.log('Attempting to delete folder:', folderPath);
      
      // First, check if folder contains any files or subfolders
      console.log('Checking folder contents before deletion...');
      const contents = await this.getContents(folderPath);
      
      if (!contents.success) {
        // If we can't read contents, try direct deletion anyway
        console.log('Could not read folder contents, attempting direct deletion');
        return await this.directDeleteFolder(folderPath);
      }

      const { files, folders } = contents.data;
      const totalItems = files.length + folders.length;
      
      console.log(`Folder contains ${files.length} files and ${folders.length} folders (total: ${totalItems} items)`);

      if (totalItems === 0) {
        // Folder is empty, use direct deletion
        console.log('Folder is empty, using direct deletion');
        return await this.directDeleteFolder(folderPath);
      } else {
        // Folder contains items, use recursive deletion
        console.log('Folder contains items, using recursive deletion');
        return await this.recursiveDeleteFolder(folderPath);
      }

    } catch (error) {
      console.error('Delete folder operation failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete folder'
      };
    }
  }

  /**
   * Direct folder deletion for empty folders
   */
  async directDeleteFolder(folderPath) {
    try {
      console.log('Performing direct folder deletion:', folderPath);
      const response = await storageAPI.deleteFolder(folderPath);
      
      console.log('Direct folder deletion successful');
      return {
        success: true,
        data: response,
        message: 'Successfully deleted empty folder'
      };
    } catch (error) {
      console.error('Direct folder deletion failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete folder'
      };
    }
  }

  /**
   * Recursively delete folder contents then the folder itself
   */
  async recursiveDeleteFolder(folderPath) {
    try {
      console.log('Starting recursive deletion for folder:', folderPath);
      
      // Get folder contents (we already know it has content, but get fresh data)
      const contents = await this.getContents(folderPath);
      if (!contents.success) {
        throw new Error(`Failed to read folder contents: ${contents.error}`);
      }

      const { files, folders } = contents.data;
      const totalItems = files.length + folders.length;
      
      console.log(`Recursively deleting ${files.length} files and ${folders.length} folders from ${folderPath}`);

      // Delete all files first
      for (const file of files) {
        // Construct proper file path
        let filePath;
        if (file.path) {
          filePath = file.path;
        } else {
          const cleanFolderPath = folderPath.replace(/\/+$/, '');
          filePath = cleanFolderPath ? `${cleanFolderPath}/${file.name}` : file.name;
        }
        
        console.log('Deleting file:', filePath);
        
        const deleteResult = await this.deleteFile(filePath);
        if (!deleteResult.success) {
          console.warn(`Failed to delete file ${filePath}:`, deleteResult.error);
          // Continue with other files even if one fails
        } else {
          console.log(`Successfully deleted file: ${filePath}`);
        }
      }

      // Recursively delete all subfolders
      for (const folder of folders) {
        // Construct proper subfolder path
        let subFolderPath;
        if (folder.path) {
          subFolderPath = folder.path;
        } else {
          const cleanFolderPath = folderPath.replace(/\/+$/, '');
          subFolderPath = cleanFolderPath ? `${cleanFolderPath}/${folder.name}` : folder.name;
        }
        
        console.log('Recursively deleting subfolder:', subFolderPath);
        
        // Recursive call to deleteFolder (which will check contents again)
        const deleteResult = await this.deleteFolder(subFolderPath);
        if (!deleteResult.success) {
          console.warn(`Failed to delete subfolder ${subFolderPath}:`, deleteResult.error);
          // Continue with other folders even if one fails
        } else {
          console.log(`Successfully deleted subfolder: ${subFolderPath}`);
        }
      }

      // Finally, delete the now-empty folder using direct deletion
      console.log('All contents deleted, now deleting empty folder:', folderPath);
      
      const finalResult = await this.directDeleteFolder(folderPath);
      if (finalResult.success) {
        return {
          success: true,
          data: finalResult.data,
          message: `Successfully deleted folder and ${totalItems} items`
        };
      } else {
        return {
          success: false,
          error: `Failed to delete folder after clearing contents: ${finalResult.error}`
        };
      }

    } catch (error) {
      console.error('Recursive folder deletion failed for:', folderPath, error);
      return {
        success: false,
        error: error.message || 'Failed to recursively delete folder'
      };
    }
  }

  async checkFileExists(fileName) {
    try {
      const response = await storageAPI.checkFileExists(fileName);
      return {
        success: true,
        exists: response?.exists || false
      };
    } catch (error) {
      // If file doesn't exist, API might return 404
      if (error.response?.status === 404) {
        return {
          success: true,
          exists: false
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check file existence'
      };
    }
  }

  async checkFolderExists(folderPath) {
    try {
      const response = await storageAPI.checkFolderExists(folderPath);
      return {
        success: true,
        exists: response?.exists || false
      };
    } catch (error) {
      // If folder doesn't exist, API might return 404
      if (error.response?.status === 404) {
        return {
          success: true,
          exists: false
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check folder existence'
      };
    }
  }

  // ============ Upload Operations ============

  /**
   * Sanitize file name to meet backend requirements
   * Only allows alphanumeric characters, dots, hyphens, underscores, and forward slashes
   */
  sanitizeFileName(fileName) {
    // Replace invalid characters with underscores
    // Keep alphanumeric, dots, hyphens, underscores, and forward slashes
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    
    // Remove multiple consecutive underscores
    return sanitized.replace(/_+/g, '_');
  }

  /**
   * Check if file name is valid according to backend rules
   */
  isValidFileName(fileName) {
    // Only alphanumeric characters, dots, hyphens, underscores, and forward slashes
    return /^[a-zA-Z0-9.\-_/]+$/.test(fileName);
  }

  async uploadFile(file, targetPath, onProgress = null) {
    try {
      // Sanitize the file name
      const originalFileName = file.name;
      const sanitizedFileName = this.sanitizeFileName(originalFileName);
      
      // Warn user if file name was changed
      if (originalFileName !== sanitizedFileName) {
        console.warn(`File name sanitized: "${originalFileName}" → "${sanitizedFileName}"`);
      }

      // Fix path construction to avoid double slashes
      let fileName;
      if (!targetPath || targetPath === '') {
        fileName = sanitizedFileName;
      } else {
        // Remove trailing slash from targetPath if it exists, then add single slash
        const cleanTargetPath = targetPath.replace(/\/+$/, '');
        fileName = `${cleanTargetPath}/${sanitizedFileName}`;
      }
      
      console.log('Requesting upload URL for fileName:', fileName);
      
      const urlResponse = await storageAPI.getUploadUrl(fileName);
      console.log('Upload URL response:', urlResponse);
      
      // Handle the correct API response format
      if (!urlResponse?.success) {
        // Handle validation errors
        if (urlResponse?.status === 'failed' && urlResponse?.data) {
          const errorMessages = Object.values(urlResponse.data).flat();
          throw new Error(`File validation failed: ${errorMessages.join(', ')}`);
        }
        throw new Error(urlResponse?.message || 'Failed to get upload URL');
      }
      
      const uploadUrl = urlResponse.data?.url;
      if (!uploadUrl) {
        throw new Error('Upload URL not found in response');
      }

      console.log('Uploading file to URL:', uploadUrl);
      
      // Create a new file object with sanitized name if it was changed
      const fileToUpload = originalFileName !== sanitizedFileName 
        ? new File([file], sanitizedFileName, { type: file.type })
        : file;
      
      await this.uploadToPresignedUrl(fileToUpload, uploadUrl, onProgress);

      return {
        success: true,
        data: {
          fileName,
          originalFileName,
          sanitizedFileName,
          nameChanged: originalFileName !== sanitizedFileName,
          size: file.size,
          type: file.type,
          uploadUrl: uploadUrl,
          expiresIn: urlResponse.data?.expiresIn
        }
      };
    } catch (error) {
      console.error('Upload file error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async uploadToPresignedUrl(file, uploadUrl, onProgress = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve({ success: true });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  // ============ Download Operations ============

  async downloadFile(fileName) {
    try {
      console.log('Requesting download URL for fileName:', fileName);
      
      const response = await storageAPI.getDownloadUrl(fileName);
      console.log('Download URL response:', response);
      
      // Handle the correct API response format
      if (!response?.success) {
        // Handle validation errors
        if (response?.status === 'failed' && response?.data) {
          const errorMessages = Object.values(response.data).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error(response?.message || 'Failed to get download URL');
      }
      
      const downloadUrl = response.data?.url;
      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      // Determine file extension and MIME type
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const viewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'txt', 'html', 'htm', 'json', 'xml'];
      
      if (viewableExtensions.includes(fileExtension)) {
        // Open viewable files in new tab
        console.log('Opening viewable file in new tab from URL:', downloadUrl);
        window.open(downloadUrl, '_blank');
      } else {
        // Download non-viewable files
        console.log('Downloading file from URL:', downloadUrl);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName.split('/').pop();
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      return {
        success: true,
        data: { 
          fileName, 
          downloadUrl: downloadUrl,
          expiresIn: response.data?.expiresIn,
          action: viewableExtensions.includes(fileExtension) ? 'opened' : 'downloaded'
        }
      };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error.message || 'Download failed'
      };
    }
  }

  /**
   * Force download a file (always download, never open in tab)
   */
  async forceDownloadFile(fileName) {
    try {
      console.log('Requesting download URL for fileName:', fileName);
      
      const response = await storageAPI.getDownloadUrl(fileName);
      console.log('Download URL response:', response);
      
      if (!response?.success) {
        if (response?.status === 'failed' && response?.data) {
          const errorMessages = Object.values(response.data).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error(response?.message || 'Failed to get download URL');
      }
      
      const downloadUrl = response.data?.url;
      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      console.log('Force downloading file from URL:', downloadUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName.split('/').pop();
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        data: { 
          fileName, 
          downloadUrl: downloadUrl,
          expiresIn: response.data?.expiresIn,
          action: 'downloaded'
        }
      };
    } catch (error) {
      console.error('Force download error:', error);
      return {
        success: false,
        error: error.message || 'Download failed'
      };
    }
  }

  /**
   * Open file in new tab (always open, never download)
   */
  async openFileInTab(fileName) {
    try {
      console.log('Requesting download URL for fileName:', fileName);
      
      const response = await storageAPI.getDownloadUrl(fileName);
      console.log('Download URL response:', response);
      
      if (!response?.success) {
        if (response?.status === 'failed' && response?.data) {
          const errorMessages = Object.values(response.data).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error(response?.message || 'Failed to get download URL');
      }
      
      const downloadUrl = response.data?.url;
      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      console.log('Opening file in new tab from URL:', downloadUrl);
      window.open(downloadUrl, '_blank');

      return {
        success: true,
        data: { 
          fileName, 
          downloadUrl: downloadUrl,
          expiresIn: response.data?.expiresIn,
          action: 'opened'
        }
      };
    } catch (error) {
      console.error('Open file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to open file'
      };
    }
  }

  /**
   * Get download URL without triggering download or opening
   */
  async getFileUrl(fileName) {
    try {
      console.log('Requesting download URL for fileName:', fileName);
      
      const response = await storageAPI.getDownloadUrl(fileName);
      console.log('Download URL response:', response);
      
      if (!response?.success) {
        if (response?.status === 'failed' && response?.data) {
          const errorMessages = Object.values(response.data).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error(response?.message || 'Failed to get download URL');
      }
      
      const downloadUrl = response.data?.url;
      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      return {
        success: true,
        data: { 
          fileName, 
          downloadUrl: downloadUrl,
          expiresIn: response.data?.expiresIn
        }
      };
    } catch (error) {
      console.error('Get file URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get file URL'
      };
    }
  }

  // ============ Composed Operations ============

  /**
   * Rename file using copy + delete strategy
   * This is a composed operation since there's no direct rename API
   */
  async renameFile(oldPath, newPath, onProgress = null) {
    let tempFileCreated = false;
    
    try {
      onProgress?.({ step: 'checking', progress: 0 });
      
      const sourceCheck = await this.checkFileExists(oldPath);
      if (!sourceCheck.success || !sourceCheck.exists) {
        throw new Error('Source file does not exist');
      }

      const targetCheck = await this.checkFileExists(newPath);
      if (targetCheck.success && targetCheck.exists) {
        throw new Error('Target file already exists');
      }

      onProgress?.({ step: 'downloading', progress: 25 });

      const downloadResponse = await storageAPI.getDownloadUrl(oldPath);
      // Handle the download URL response format (assuming similar to upload)
      let downloadUrl;
      if (downloadResponse?.success && downloadResponse.data?.url) {
        downloadUrl = downloadResponse.data.url;
      } else if (downloadResponse?.downloadUrl) {
        // Fallback to old format
        downloadUrl = downloadResponse.downloadUrl;
      } else {
        throw new Error('Failed to get download URL for source file');
      }

      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to download source file');
      }
      
      const fileBlob = await fileResponse.blob();
      const fileName = newPath.split('/').pop();
      const file = new File([fileBlob], fileName, { type: fileBlob.type });

      onProgress?.({ step: 'uploading', progress: 50 });

      const targetDir = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
      const uploadResult = await this.uploadFile(file, targetDir, 
        (progress) => onProgress?.({ step: 'uploading', progress: 50 + (progress * 0.4) })
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      tempFileCreated = true;
      onProgress?.({ step: 'verifying', progress: 90 });

      const verifyCheck = await this.checkFileExists(newPath);
      if (!verifyCheck.success || !verifyCheck.exists) {
        throw new Error('Failed to verify new file creation');
      }

      onProgress?.({ step: 'cleaning', progress: 95 });

      const deleteResult = await this.deleteFile(oldPath);
      if (!deleteResult.success) {
        console.warn('Failed to delete original file:', deleteResult.error);
      }

      onProgress?.({ step: 'complete', progress: 100 });

      return {
        success: true,
        data: { oldPath, newPath, method: 'copy-delete' }
      };

    } catch (error) {
      if (tempFileCreated) {
        try {
          await this.deleteFile(newPath);
        } catch (rollbackError) {
          console.error('Failed to rollback temp file:', rollbackError);
        }
      }

      return {
        success: false,
        error: error.message || 'Rename operation failed',
        method: 'copy-delete'
      };
    }
  }

  /**
   * Rename folder using recursive copy + delete strategy
   */
  async renameFolder(oldPath, newPath, onProgress = null) {
    try {
      onProgress?.({ step: 'checking', progress: 0 });

      const sourceCheck = await this.checkFolderExists(oldPath);
      if (!sourceCheck.success || !sourceCheck.exists) {
        throw new Error('Source folder does not exist');
      }

      const targetCheck = await this.checkFolderExists(newPath);
      if (targetCheck.success && targetCheck.exists) {
        throw new Error('Target folder already exists');
      }

      onProgress?.({ step: 'analyzing', progress: 10 });

      const contents = await this.getContents(oldPath);
      if (!contents.success) {
        throw new Error('Failed to read source folder contents');
      }

      // Create the new folder with the full path
      const createResult = await this.createFolder(newPath);
      if (!createResult.success) {
        throw new Error('Failed to create target folder');
      }

      onProgress?.({ step: 'copying', progress: 20 });

      const files = contents.data.files || [];
      const totalItems = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Fix path construction to avoid double slashes
        const cleanOldPath = oldPath.replace(/\/+$/, '');
        const cleanNewPath = newPath.replace(/\/+$/, '');
        const sourceFilePath = `${cleanOldPath}/${file.name}`;
        const targetFilePath = `${cleanNewPath}/${file.name}`;
        
        const renameResult = await this.renameFile(sourceFilePath, targetFilePath);
        if (!renameResult.success) {
          throw new Error(`Failed to copy file ${file.name}: ${renameResult.error}`);
        }
        
        const progress = 20 + ((i + 1) / totalItems) * 60;
        onProgress?.({ step: 'copying', progress, current: i + 1, total: totalItems });
      }

      onProgress?.({ step: 'cleaning', progress: 90 });

      const deleteResult = await this.deleteFolder(oldPath);
      if (!deleteResult.success) {
        console.warn('Failed to delete original folder:', deleteResult.error);
      }

      onProgress?.({ step: 'complete', progress: 100 });

      return {
        success: true,
        data: { oldPath, newPath, method: 'recursive-copy-delete', itemsProcessed: totalItems }
      };

    } catch (error) {
      try {
        await this.deleteFolder(newPath);
      } catch (cleanupError) {
        console.error('Failed to cleanup partial folder copy:', cleanupError);
      }

      return {
        success: false,
        error: error.message || 'Folder rename operation failed',
        method: 'recursive-copy-delete'
      };
    }
  }

  /**
   * Move item (file or folder) to a new location
   */
  async moveItem(sourcePath, targetPath, isFolder = false, onProgress = null) {
    if (isFolder) {
      return this.renameFolder(sourcePath, targetPath, onProgress);
    } else {
      return this.renameFile(sourcePath, targetPath, onProgress);
    }
  }

  /**
   * Batch delete multiple items
   */
  async batchDelete(items, onProgress = null) {
    const results = [];
    const totalItems = items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      onProgress?.({ 
        current: i + 1, 
        total: totalItems, 
        progress: ((i + 1) / totalItems) * 100,
        currentItem: item.name
      });

      let result;
      if (item.type === 'folder') {
        result = await this.deleteFolder(item.path);
      } else {
        result = await this.deleteFile(item.path);
      }

      results.push({
        item,
        success: result.success,
        error: result.error
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failedItems = results.filter(r => !r.success);

    return {
      success: failedItems.length === 0,
      data: {
        total: totalItems,
        successful: successCount,
        failed: failedItems.length,
        results,
        failedItems
      }
    };
  }

  /**
   * Create a unique folder name if name already exists
   */
  async createUniqueFolder(basePath, desiredName) {
    let folderName = desiredName;
    let counter = 1;
    
    while (true) {
      // Construct the full path properly for the backend - avoid double slashes
      let fullPath;
      if (!basePath || basePath === '') {
        fullPath = folderName;
      } else {
        // Remove trailing slash from basePath if it exists, then add single slash
        const cleanBasePath = basePath.replace(/\/+$/, '');
        fullPath = `${cleanBasePath}/${folderName}`;
      }
      
      const check = await this.checkFolderExists(fullPath);
      
      if (!check.success || !check.exists) {
        // Pass the full path to createFolder
        const result = await this.createFolder(fullPath);
        
        // If creation failed due to validation errors, return the error
        if (!result.success && result.validationErrors) {
          return result;
        }
        
        return result;
      }
      
      folderName = `${desiredName} (${counter})`;
      counter++;
      
      if (counter > 100) {
        return {
          success: false,
          error: 'Unable to create unique folder name after 100 attempts'
        };
      }
    }
  }

  /**
   * Get folder tree structure for navigation
   */
  async getFolderTree(rootPath = '', maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    try {
      const contents = await this.getContents(rootPath);
      if (!contents.success) return [];

      const folders = contents.data.folders || [];
      const tree = [];

      for (const folder of folders) {
        // Fix path construction to avoid double slashes
        let folderPath;
        if (!rootPath || rootPath === '') {
          folderPath = folder.name;
        } else {
          const cleanRootPath = rootPath.replace(/\/+$/, '');
          folderPath = `${cleanRootPath}/${folder.name}`;
        }
        
        const children = await this.getFolderTree(folderPath, maxDepth, currentDepth + 1);
        
        tree.push({
          name: folder.name,
          path: folderPath,
          children,
          hasChildren: children.length > 0
        });
      }

      return tree;
    } catch (error) {
      console.error('Failed to build folder tree:', error);
      return [];
    }
  }
}

// Export singleton instance
export const storageClient = new StorageClient();
export default storageClient;
