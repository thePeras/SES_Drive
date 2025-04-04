import { Input } from "@/components/ui/input";
import { toast } from "sonner"; 
import { useState } from "react";
import { Button } from "@/components/ui/button"; 

export function FileInput() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedFile) {
      try {
        console.log("Uploading file:", selectedFile);

        toast.success(`${selectedFile.name} uploaded successfully.`);

        setSelectedFile(null);
        (event.target as HTMLFormElement).reset();
      } catch (error: any) {
        toast.error(`File upload failed: ${error.message || "Something went wrong."}`); 
      }
    } else {
      toast.info("Please select a file to upload."); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm items-center gap-1.5">
      <Input
        type="file"
        onChange={handleInputChange}
      />
      {selectedFile && (
        <p className="text-sm text-gray-500 mt-1">
          Selected file: {selectedFile.name}
        </p>
      )}
      <Button type="submit">Submit file</Button>
    </form>
  );
}