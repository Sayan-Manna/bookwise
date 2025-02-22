"use client";
import { IKImage, ImageKitProvider, IKUpload } from "imagekitio-next";
import config from "@/lib/config";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config; // we must not try to get access of the private key as it is reserved for the server side only

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/imagekit`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const { signature, expire, token } = data;
    return {
      token,
      expire,
      signature,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to authenticate :: ${error.message}`);
  }
};
interface Props {
  onFileChange: (filePath: string) => void;
  value?: string;
}
const FileUpload = ({ onFileChange, value }: Props) => {
  const ikUploadRef = useRef(null);
  const [file, setFile] = useState<{ filePath: string } | null>(null);

  const onError = (eror: any) => {
    console.log(error);
    toast({
      title: ` upload failed`,
      description: `Your image could not be uploaded. Please try again.`,
      variant: "destructive",
    });
  };
  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);

    toast({
      title: ` uploaded successfully`,
      description: `${res.filePath} uploaded successfully!`,
    });
  };

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <IKUpload className="hidden" ref={ikUploadRef} onError={onError} onSuccess={onSuccess} fileName="test-upload.png" />
      <button
        className={cn("upload-btn")}
        onClick={(e) => {
          e.preventDefault();
          if (ikUploadRef?.current) {
            // @ts-ignore
            ikUploadRef.current?.click();
          }
        }}
      >
        <Image src="/icons/upload.svg" alt="upload-icon" width={20} height={20} className="object-contain" />
        <p className={cn("text-base")}>Upload a file</p>
        {/* if file exists */}
        {file && <p className="upload-filename">{file.filePath}</p>}
      </button>
      {/* If file exists -> show it to the user */}
      {file && <IKImage path={file.filePath} alt={file.filePath} width={500} height={500} />}
    </ImageKitProvider>
  );
};

export default FileUpload;
