"use client"

import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
}

export function UploadArea({ onUpload, isUploading }: UploadAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const isCsv = droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv');
            const isPdf = droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf');

            if (isCsv || isPdf) {
                setFile(droppedFile);
                onUpload(droppedFile);
            } else {
                alert('Por favor, envie apenas arquivos CSV ou PDF.');
            }
        }
    }, [onUpload]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            onUpload(selectedFile);
        }
    };

    return (
        <Card
            className={cn(
                "border-2 border-dashed transition-colors duration-200 ease-in-out cursor-pointer",
                isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50",
                isUploading ? "opacity-50 pointer-events-none" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.pdf"
                    onChange={handleChange}
                />

                <div className="p-4 rounded-full bg-background border shadow-sm">
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : file ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold tracking-tight text-lg">
                        {isUploading ? "Processando..." : file ? "Arquivo Recebido!" : "Upload de Extrato"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {file ? file.name : "Arraste seu CSV/PDF ou clique para selecionar"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
