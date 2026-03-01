import { useRef, useState } from "react";
import { API_BASE } from "../config";

export default function CoverImageField({ value, onChange, getAuthHeaders }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileSelect(ev) {
    const file = ev.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPEG, PNG, GIF, WebP).");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_BASE}/api/upload-image`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        setUploadError(data.error || "Upload failed");
      }
    } catch (e) {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="cover-image-field">
      <input
        type="url"
        placeholder="Cover image URL (or upload below)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="cover-image-upload">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="btn-outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !getAuthHeaders?.()?.["x-admin-token"]}
        >
          {uploading ? "Uploading…" : "Upload from device"}
        </button>
      </div>
      {uploadError && <p className="form-error">{uploadError}</p>}
      {value && (
        <div className="cover-preview">
          <img src={value} alt="Cover preview" />
        </div>
      )}
    </div>
  );
}
