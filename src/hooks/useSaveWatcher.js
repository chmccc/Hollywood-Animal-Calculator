import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to watch a save directory for new files using the File System Access API.
 * 
 * Features:
 * - Requests directory access from user
 * - Polls directory for new/modified .json files
 * - Persists directory handle in IndexedDB across sessions
 * - Automatically loads newest save file when detected
 * 
 * Limitations:
 * - Only works in Chrome/Edge (not Firefox/Safari)
 * - Requires explicit user permission
 * - Uses polling (not native file system events)
 */

const DB_NAME = 'HollywoodAnimalCalculator';
const STORE_NAME = 'directoryHandles';
const HANDLE_KEY = 'saveDirectory';

// Default polling interval (ms)
const DEFAULT_POLL_INTERVAL = 3000;

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window;
}

/**
 * Open IndexedDB database for storing directory handles
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Store directory handle in IndexedDB
 */
async function storeDirectoryHandle(handle) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Retrieve stored directory handle from IndexedDB
 */
async function getStoredDirectoryHandle() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

/**
 * Remove stored directory handle from IndexedDB
 */
async function clearStoredDirectoryHandle() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Check if we still have permission for a directory handle
 */
async function verifyPermission(handle) {
  try {
    const options = { mode: 'read' };
    // Check current permission state
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    // Try to request permission (may prompt user)
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get all .json files in a directory with their modification times
 */
async function getJsonFilesInDirectory(dirHandle) {
  const files = [];
  
  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        try {
          const file = await entry.getFile();
          files.push({
            name: entry.name,
            handle: entry,
            lastModified: file.lastModified,
            size: file.size
          });
        } catch {
          // Skip files we can't read
        }
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
    throw err;
  }
  
  return files;
}

/**
 * Find the newest .json file in the list
 */
function findNewestFile(files) {
  if (files.length === 0) return null;
  return files.reduce((newest, file) => 
    file.lastModified > newest.lastModified ? file : newest
  );
}

/**
 * Read file content from a file handle
 */
async function readFileContent(fileHandle) {
  const file = await fileHandle.getFile();
  return await file.text();
}

/**
 * Hook for watching a save directory
 * 
 * @param {Object} options
 * @param {Function} options.onNewSave - Callback when a new save is detected (receives jsonString, fileName)
 * @param {number} options.pollInterval - How often to check for changes (ms), default 3000
 * @returns {Object} - Watcher state and controls
 */
export function useSaveWatcher({ onNewSave, pollInterval = DEFAULT_POLL_INTERVAL }) {
  const [isSupported] = useState(() => isFileSystemAccessSupported());
  const [isWatching, setIsWatching] = useState(false);
  const [directoryName, setDirectoryName] = useState(null);
  const [lastLoadedFile, setLastLoadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for polling
  const dirHandleRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastFileStateRef = useRef(null); // { name, lastModified }
  const isInitializedRef = useRef(false);
  
  /**
   * Poll the directory for changes
   */
  const pollDirectory = useCallback(async () => {
    if (!dirHandleRef.current) return;
    
    try {
      const files = await getJsonFilesInDirectory(dirHandleRef.current);
      const newest = findNewestFile(files);
      
      if (!newest) return;
      
      const lastState = lastFileStateRef.current;
      
      // Check if this is a new or modified file
      const isNewOrModified = !lastState || 
        newest.name !== lastState.name || 
        newest.lastModified !== lastState.lastModified;
      
      if (isNewOrModified && isInitializedRef.current) {
        // Load the new save file
        const content = await readFileContent(newest.handle);
        setLastLoadedFile(newest.name);
        onNewSave?.(content, newest.name, newest.lastModified);
      }
      
      // Update tracked state
      lastFileStateRef.current = {
        name: newest.name,
        lastModified: newest.lastModified
      };
      
      // Mark as initialized after first poll
      isInitializedRef.current = true;
      
    } catch (err) {
      console.error('Poll error:', err);
      // If permission was revoked, stop watching
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        stopWatching();
        setError('Permission to access folder was revoked');
      }
    }
  }, [onNewSave]);
  
  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Initial poll
    pollDirectory();
    
    // Set up interval
    pollIntervalRef.current = setInterval(pollDirectory, pollInterval);
  }, [pollDirectory, pollInterval]);
  
  /**
   * Stop watching the directory
   */
  const stopWatching = useCallback(async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    dirHandleRef.current = null;
    lastFileStateRef.current = null;
    isInitializedRef.current = false;
    
    setIsWatching(false);
    setDirectoryName(null);
    setLastLoadedFile(null);
    
    await clearStoredDirectoryHandle();
  }, []);
  
  /**
   * Request access to a directory and start watching
   */
  const selectDirectory = useCallback(async () => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Show directory picker
      const dirHandle = await window.showDirectoryPicker({
        id: 'hollywood-animal-saves',
        mode: 'read',
        startIn: 'documents'
      });
      
      // Store handle and start watching
      dirHandleRef.current = dirHandle;
      await storeDirectoryHandle(dirHandle);
      
      setDirectoryName(dirHandle.name);
      setIsWatching(true);
      setIsLoading(false);
      
      // Mark as initialized so polling will detect future changes
      isInitializedRef.current = true;
      
      // Load the newest file immediately
      const files = await getJsonFilesInDirectory(dirHandle);
      const newest = findNewestFile(files);
      
      if (newest) {
        const content = await readFileContent(newest.handle);
        setLastLoadedFile(newest.name);
        onNewSave?.(content, newest.name, newest.lastModified);
        
        // Track this file so we don't reload it on the first poll
        lastFileStateRef.current = {
          name: newest.name,
          lastModified: newest.lastModified
        };
      }
      
      // Start polling for future changes
      startPolling();
      
      return true;
    } catch (err) {
      setIsLoading(false);
      
      if (err.name === 'AbortError') {
        // User cancelled the picker
        return false;
      }
      
      console.error('Directory selection error:', err);
      setError(`Failed to access directory: ${err.message}`);
      return false;
    }
  }, [isSupported, startPolling, onNewSave]);
  
  /**
   * Try to restore a previously granted directory handle
   */
  const restoreWatching = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const storedHandle = await getStoredDirectoryHandle();
      if (!storedHandle) return false;
      
      // Verify we still have permission
      const hasPermission = await verifyPermission(storedHandle);
      if (!hasPermission) {
        await clearStoredDirectoryHandle();
        return false;
      }
      
      // Restore watching
      dirHandleRef.current = storedHandle;
      setDirectoryName(storedHandle.name);
      setIsWatching(true);
      
      // Start polling
      startPolling();
      
      return true;
    } catch (err) {
      console.error('Failed to restore watching:', err);
      await clearStoredDirectoryHandle();
      return false;
    }
  }, [isSupported, startPolling]);
  
  /**
   * Force reload the current newest file
   */
  const forceReload = useCallback(async () => {
    if (!dirHandleRef.current) return;
    
    try {
      const files = await getJsonFilesInDirectory(dirHandleRef.current);
      const newest = findNewestFile(files);
      
      if (newest) {
        const content = await readFileContent(newest.handle);
        setLastLoadedFile(newest.name);
        onNewSave?.(content, newest.name, newest.lastModified);
        
        lastFileStateRef.current = {
          name: newest.name,
          lastModified: newest.lastModified
        };
      }
    } catch (err) {
      console.error('Force reload error:', err);
      setError(`Failed to reload: ${err.message}`);
    }
  }, [onNewSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  
  // Try to restore watching on mount (if permission was previously granted)
  useEffect(() => {
    if (isSupported && !isWatching) {
      restoreWatching();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    // State
    isSupported,
    isWatching,
    directoryName,
    lastLoadedFile,
    error,
    isLoading,
    
    // Actions
    selectDirectory,
    stopWatching,
    restoreWatching,
    forceReload,
    clearError: () => setError(null)
  };
}

export default useSaveWatcher;
