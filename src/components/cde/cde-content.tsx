"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FolderOpen,
  FolderPlus,
  File,
  FileText,
  FileImage,
  Upload,
  Trash2,
  X,
  Plus,
} from "lucide-react";

const COLOR_OPTIONS = [
  { value: "#6366f1", label: "Índigo" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
];

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }
  return (size / 1024).toFixed(1) + " KB";
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf") || mimeType.includes("text")) {
    return FileText;
  }
  if (mimeType.includes("image")) {
    return FileImage;
  }
  return File;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CdeContent() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("#6366f1");
  const [deleteConfirmFileId, setDeleteConfirmFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: folders = [], isLoading: foldersLoading } = trpc.cde.listFolders.useQuery({});

  const { data: files = [], isLoading: filesLoading } = trpc.cde.listFiles.useQuery(
    { folderId: selectedFolderId! },
    { enabled: !!selectedFolderId }
  );

  const createFolder = trpc.cde.createFolder.useMutation({
    onSuccess: () => {
      toast.success("Pasta criada com sucesso");
      utils.cde.listFolders.invalidate();
      setShowNewFolderModal(false);
      setFolderName("");
      setFolderDescription("");
      setFolderColor("#6366f1");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar pasta");
    },
  });

  const deleteFolder = trpc.cde.deleteFolder.useMutation({
    onSuccess: () => {
      toast.success("Pasta removida");
      utils.cde.listFolders.invalidate();
      if (selectedFolderId) {
        setSelectedFolderId(null);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao remover pasta");
    },
  });

  const createFile = trpc.cde.createFile.useMutation({
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso");
      utils.cde.listFiles.invalidate({ folderId: selectedFolderId! });
      utils.cde.listFolders.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar arquivo");
    },
  });

  const deleteFile = trpc.cde.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("Arquivo removido");
      utils.cde.listFiles.invalidate({ folderId: selectedFolderId! });
      utils.cde.listFolders.invalidate();
      setDeleteConfirmFileId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao remover arquivo");
    },
  });

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    createFolder.mutate({
      name: folderName.trim(),
      description: folderDescription.trim() || undefined,
      color: folderColor,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;
    e.target.value = "";

    setUploading(true);
    try {
      const mimeType = file.type || "application/octet-stream";

      // 1. Tenta presigned URL (S3/R2)
      const presignRes = await fetch(
        `/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(mimeType)}&folder=cde&size=${file.size}`
      );

      let fileKey: string;
      let fileUrl: string;

      if (presignRes.ok) {
        // Upload direto para S3/R2
        const { uploadUrl, fileKey: key, fileUrl: url } = await presignRes.json() as {
          uploadUrl: string; fileKey: string; fileUrl: string;
        };
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": mimeType },
        });
        if (!putRes.ok) throw new Error("Falha no upload para S3");
        fileKey = key;
        fileUrl = url;
      } else {
        // Fallback: upload local via POST multipart
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "cde");
        const localRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!localRes.ok) throw new Error("Falha no upload local");
        const data = await localRes.json() as { fileKey: string; fileUrl: string };
        fileKey = data.fileKey;
        fileUrl = data.fileUrl;
      }

      // 2. Registra no banco
      createFile.mutate({
        name: file.name,
        fileKey,
        fileSize: file.size,
        mimeType,
        folderId: selectedFolderId,
        tags: [],
      });

      void fileUrl; // usado para futura preview/download
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CDE</h1>
          <p className="text-sm text-muted-foreground">Common Data Environment — Gestão de Arquivos</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Left Panel — Folder Tree */}
        <div className="w-1/4 flex flex-col gap-3">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Pasta
          </button>

          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-2 space-y-1">
            {foldersLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <FolderOpen className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira pasta para organizar os arquivos do projeto
                </p>
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedFolderId === folder.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted border border-transparent"
                  }`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <FolderOpen
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: folder.color ?? "#6366f1" }}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {folder._count.files}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder.mutate({ id: folder.id });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Files */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Right Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedFolder ? selectedFolder.name : "Selecione uma pasta"}
            </h2>
            {selectedFolderId && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  disabled={uploading || createFile.isPending}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Enviando..." : createFile.isPending ? "Salvando..." : "Upload Arquivo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            )}
          </div>

          {/* Files Area */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4">
            {!selectedFolderId ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">Selecione uma pasta para ver os arquivos</p>
              </div>
            ) : filesLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Upload className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  Nenhum arquivo nesta pasta. Clique em "Upload Arquivo" para começar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  const isConfirming = deleteConfirmFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className="relative flex flex-col gap-2 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
                    >
                      {/* Delete button */}
                      <button
                        onClick={() =>
                          isConfirming
                            ? deleteFile.mutate({ id: file.id })
                            : setDeleteConfirmFileId(file.id)
                        }
                        className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title={isConfirming ? "Confirmar exclusão" : "Remover arquivo"}
                      >
                        {isConfirming ? (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>

                      {isConfirming && (
                        <button
                          onClick={() => setDeleteConfirmFileId(null)}
                          className="absolute top-2 right-8 p-1 rounded text-muted-foreground hover:text-foreground transition-colors text-xs"
                          title="Cancelar"
                        >
                          Cancelar
                        </button>
                      )}

                      {/* File Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <FileIcon className="w-5 h-5 text-primary" />
                      </div>

                      {/* File Name */}
                      <p className="text-sm font-medium text-foreground truncate pr-6" title={file.name}>
                        {file.name}
                      </p>

                      {/* File Meta */}
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(Number(file.fileSize))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.uploadedBy.name ?? file.uploadedBy.email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" />
                Nova Pasta
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nome <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Projetos Arquitetônicos"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <input
                  type="text"
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Descrição opcional"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Cor</label>
                <div className="mt-2 flex gap-2">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFolderColor(option.value)}
                      title={option.label}
                      className={`w-8 h-8 rounded-full transition-all ${
                        folderColor === option.value
                          ? "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: option.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || createFolder.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createFolder.isPending ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
