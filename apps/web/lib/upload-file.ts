export function uploadFileToPresignedUrl(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): { promise: Promise<void>; abort: () => void } {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.onabort = () => {
      const err = new Error("Upload cancelled");
      err.name = "AbortError";
      reject(err);
    };

    xhr.send(file);
  });

  return { promise, abort: () => xhr.abort() };
}