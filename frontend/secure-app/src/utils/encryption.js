export const generateEncryptionKey = async () => {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
};
  
export const encryptFile = async (file, key) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileData = await file.arrayBuffer();

    const encryptedData = await window.crypto.subtle.encrypt(
        {
        name: "AES-GCM",
        iv: iv
        },
        key,
        fileData
    );

    // Export key for storage
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);

    // Combine IV and encrypted data
    const encryptedFile = new Blob([iv, encryptedData]);

    return {
        encryptedFile,
        encryptedKey: exportedKey
    };
};

export const decryptFile = async (encryptedBlob, encryptedKey, iv) => {
    try {
      // Import the key (encryptedKey is already a Uint8Array)
      const key = await window.crypto.subtle.importKey(
        "raw",
        encryptedKey,
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["decrypt"]
      );
  
      // Get the data as ArrayBuffer
      const encryptedData = await encryptedBlob.arrayBuffer();
  
      // Decrypt the data (iv is already a Uint8Array)
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encryptedData
      );
  
      return new Blob([decryptedData]);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  };