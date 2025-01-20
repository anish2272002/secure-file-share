import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axiosConfig';

const API_URL = `https://${process.env.REACT_APP_APP_HOST}:${process.env.REACT_APP_APP_PORT}/storage`;

export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ file, encryptedKey, fileName, fileType, fileSize }, { rejectWithValue }) => {
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('encrypted_key', encryptedKey);
      formData.append('file_name', fileName);
      formData.append('file_type', fileType);
      formData.append('file_size', fileSize);

      const response = await api.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // You can dispatch progress updates here if needed
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Upload failed');
    }
  }
);

export const downloadFile = createAsyncThunk(
  'files/downloadFile',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/download/${fileId}`, {
        responseType: 'arraybuffer',
        headers: {
          Accept: '*/*',
        }
      });
      // Get headers directly from response
      const encryptedKeyB64 = response.headers['encrypted-key'];
      const fileType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'];
      
      // Extract IV from the first 12 bytes of the response data
      const arrayBuffer = response.data;
      const iv = arrayBuffer.slice(0, 12);
      const encryptedData = arrayBuffer.slice(12);

      if (!encryptedKeyB64 || !iv) {
        throw new Error('Missing required encryption data');
      }

      // Convert base64 key to Uint8Array
      const encryptedKey = Uint8Array.from(
        atob(encryptedKeyB64), 
        c => c.charCodeAt(0)
      );

      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
        : 'downloaded-file';

      return {
        file: encryptedData,
        encryptedKey,
        iv: new Uint8Array(iv),
        file_type: fileType,
        file_name: fileName
      };
    } catch (error) {
      console.error('Download error details:', error);
      return rejectWithValue(error.message || 'Download failed');
    }
  }
);

export const listFiles = createAsyncThunk(
  'files/list',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/files`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch files');
    }
  }
);

// Add new thunk for sharing files
export const shareFile = createAsyncThunk(
  'files/share',
  async ({ fileId, shareData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/share/${fileId}`, shareData);
      return response.data;
    } catch (error) {
      console.error('Share error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data || 
        'Failed to share file'
      );
    }
  }
);

// Add new thunk for getting file shares
export const getFileShares = createAsyncThunk(
  'files/getShares',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/share/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Get shares error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data || 
        'Failed to get file shares'
      );
    }
  }
);
export const createShareableLink = createAsyncThunk(
  'files/createShareableLink',
  async ({ fileId, expirationHours = 24,permission }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/share/${fileId}/share-link`, {
        expiration_hours: expirationHours,
        permission: permission
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 
        'Failed to create shareable link'
      );
    }
  }
);

// Rest of the slice remains the same
const fileSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    currentFile: null,
    loading: false,
    error: null,
    uploadProgress: 0,
    downloadProgress: 0,
    shares: [], // Add this to track file shares
    shareLoading: false, // Add this for share-specific loading state
    shareError: null,
    createLinkLoading: false,
    createLinkError: null,
  },
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setDownloadProgress: (state, action) => {
      state.downloadProgress = action.payload;
    },
    clearFileError: (state) => {
      state.error = null;
    },
    clearShareError: (state) => {
      state.shareError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload file cases
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.unshift(action.payload);
        state.uploadProgress = 100;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      })
      
      // Download file cases
      .addCase(downloadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadProgress = 0;
      })
      .addCase(downloadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = action.payload;
        state.downloadProgress = 100;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.downloadProgress = 0;
      })
      
      // List files cases
      .addCase(listFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(listFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Share file cases
      .addCase(shareFile.pending, (state) => {
        state.shareLoading = true;
        state.shareError = null;
      })
      .addCase(shareFile.fulfilled, (state, action) => {
        state.shareLoading = false;
        // Update the shares array with the new share
        state.shares = [...state.shares, action.payload];
        // Update the is_shared status of the file
        const file = state.files.find(f => f.id === action.payload.id);
        if (file) {
          file.is_shared = true;
        }
      })
      .addCase(shareFile.rejected, (state, action) => {
        state.shareLoading = false;
        state.shareError = action.payload;
      })

      // Get file shares cases
      .addCase(getFileShares.pending, (state) => {
        state.shareLoading = true;
        state.shareError = null;
      })
      .addCase(getFileShares.fulfilled, (state, action) => {
        state.shareLoading = false;
        state.shares = action.payload;
      })
      .addCase(getFileShares.rejected, (state, action) => {
        state.shareLoading = false;
        state.shareError = action.payload;
      })
      .addCase(createShareableLink.pending, (state) => {
        state.createLinkLoading = true;
        state.createLinkError = null;
      })
      .addCase(createShareableLink.fulfilled, (state, action) => {
        state.createLinkLoading = false;
      })
      .addCase(createShareableLink.rejected, (state, action) => {
        state.createLinkLoading = false;
        state.createLinkError = action.payload;
      });
  },
});

export const { 
  setUploadProgress, 
  setDownloadProgress, 
  clearFileError,
  clearShareError
} = fileSlice.actions;

export const selectFiles = (state) => state.files.files;
export const selectCurrentFile = (state) => state.files.currentFile;
export const selectFileLoading = (state) => state.files.loading;
export const selectFileError = (state) => state.files.error;
export const selectShareLoading = (state) => state.files.shareLoading;
export const selectShareError = (state) => state.files.shareError;
export const selectUploadProgress = (state) => state.files.uploadProgress;
export const selectDownloadProgress = (state) => state.files.downloadProgress;

export default fileSlice.reducer;