"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Send,
  Image,
  Video,
  FileText,
  Mic,
  MapPin,
  Smile,
  Upload,
  X,
} from "lucide-react";
import { baileysAPI, BaileysAPI } from "@/lib/api";

interface MessageSenderProps {
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
}

type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "location"
  | "poll";

export function MessageSender({
  sessionId,
  onSessionChange,
}: MessageSenderProps) {
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [recipient, setRecipient] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para diferentes tipos de mensaje
  const [textMessage, setTextMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const resetForm = () => {
    setTextMessage("");
    setCaption("");
    setLatitude("");
    setLongitude("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return BaileysAPI.formatPhoneNumber(phone, isGroup);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    console.log("📁 [UPLOAD DEBUG] Iniciando subida de archivo:", file.name);
    console.log(
      "📁 [UPLOAD DEBUG] Tamaño del archivo:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB"
    );
    console.log("📁 [UPLOAD DEBUG] Tipo de archivo:", file.type);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Usar el endpoint correcto del backend Baileys
      const uploadUrl = "https://backend.autosystemprojects.site/upload2";
      console.log("📁 [UPLOAD DEBUG] Enviando a endpoint:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("📁 [UPLOAD DEBUG] Status de respuesta:", response.status);
      console.log("📁 [UPLOAD DEBUG] Response OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("📁 [UPLOAD DEBUG] Error response text:", errorText);
        throw new Error(
          `Error uploading file: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("📁 [UPLOAD DEBUG] Respuesta completa del upload:", data);

      if (!data.imagePath) {
        console.error("📁 [UPLOAD DEBUG] imagePath no encontrado en respuesta");
        console.error(
          "📁 [UPLOAD DEBUG] Keys en respuesta:",
          Object.keys(data)
        );
        throw new Error("imagePath not found in upload response");
      }

      const imagePath = data.imagePath;
      console.log("📁 [UPLOAD DEBUG] imagePath recibido:", imagePath);

      // MANTENER el path local tal como viene del backend
      // El usuario confirmó que funciona con: "./public/uploads/file.jpg"
      // NO convertir a URL HTTP, usar el path tal como está
      console.log(
        "📁 [UPLOAD DEBUG] Usando path local del backend:",
        imagePath
      );

      return imagePath;
    } catch (error) {
      console.error("📁 [UPLOAD DEBUG] Error capturado:", error);
      console.error(
        "📁 [UPLOAD DEBUG] Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      throw new Error(
        `Error uploading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const sendMessage = async () => {
    console.log("🚀 [SEND DEBUG] ===================================");
    console.log("🚀 [SEND DEBUG] Iniciando proceso de envío");
    console.log("🚀 [SEND DEBUG] Session ID:", sessionId);
    console.log("🚀 [SEND DEBUG] Tipo de mensaje:", messageType);
    console.log("🚀 [SEND DEBUG] Destinatario original:", recipient);
    console.log("🚀 [SEND DEBUG] Es grupo:", isGroup);

    if (!sessionId) {
      console.error("🚀 [SEND DEBUG] Error: No hay sesión seleccionada");
      toast({
        title: "Error",
        description: "Selecciona una sesión primero",
        variant: "destructive",
      });
      return;
    }

    if (!recipient.trim()) {
      console.error("🚀 [SEND DEBUG] Error: Destinatario vacío");
      toast({
        title: "Error",
        description: "Ingresa el número del destinatario",
        variant: "destructive",
      });
      return;
    }

    if (!BaileysAPI.isValidPhoneNumber(recipient)) {
      console.error("🚀 [SEND DEBUG] Error: Número de teléfono inválido");
      toast({
        title: "Error",
        description: "El número de teléfono no es válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const formattedRecipient = formatPhoneNumber(recipient);
      console.log(
        "🚀 [SEND DEBUG] Destinatario formateado:",
        formattedRecipient
      );

      let response;

      switch (messageType) {
        case "text":
          if (!textMessage.trim()) {
            throw new Error("Escribe un mensaje");
          }
          console.log("📤 [SEND DEBUG] Enviando mensaje de texto");
          response = await baileysAPI.sendTextMessage(sessionId, {
            receiver: formattedRecipient,
            isGroup,
            message: { text: textMessage },
          });
          break;

        case "image":
          if (!selectedFile) {
            throw new Error("Selecciona una imagen");
          }
          console.log("📤 [SEND DEBUG] Procesando imagen:", selectedFile.name);
          const imageUrl = await uploadFile(selectedFile);
          console.log(
            "📤 [SEND DEBUG] Path local de imagen del backend:",
            imageUrl
          );

          const imagePayload = {
            receiver: formattedRecipient,
            isGroup,
            message: {
              image: { url: imageUrl },
              caption: caption || undefined,
            },
          };
          console.log(
            "📤 [SEND DEBUG] Payload imagen:",
            JSON.stringify(imagePayload, null, 2)
          );
          console.log(
            "📤 [SEND DEBUG] Llamando baileysAPI.sendImageMessage con sessionId:",
            sessionId
          );
          response = await baileysAPI.sendImageMessage(sessionId, imagePayload);
          break;

        case "video":
          if (!selectedFile) {
            throw new Error("Selecciona un video");
          }
          console.log("📤 [SEND DEBUG] Procesando video:", selectedFile.name);
          const videoUrl = await uploadFile(selectedFile);
          console.log(
            "📤 [SEND DEBUG] Path local de video del backend:",
            videoUrl
          );

          const videoPayload = {
            receiver: formattedRecipient,
            isGroup,
            message: {
              video: { url: videoUrl },
              caption: caption || undefined,
            },
          };
          console.log(
            "📤 [SEND DEBUG] Payload video:",
            JSON.stringify(videoPayload, null, 2)
          );
          response = await baileysAPI.sendVideoMessage(sessionId, videoPayload);
          break;

        case "audio":
          if (!selectedFile) {
            throw new Error("Selecciona un audio");
          }
          console.log("📤 [SEND DEBUG] Procesando audio:", selectedFile.name);
          const audioUrl = await uploadFile(selectedFile);
          console.log(
            "📤 [SEND DEBUG] Path local de audio del backend:",
            audioUrl
          );

          const audioPayload = {
            receiver: formattedRecipient,
            isGroup,
            message: {
              audio: { url: audioUrl },
              ptt: true,
            },
          };
          console.log(
            "📤 [SEND DEBUG] Payload audio:",
            JSON.stringify(audioPayload, null, 2)
          );
          response = await baileysAPI.sendAudioMessage(sessionId, audioPayload);
          break;

        case "document":
          if (!selectedFile) {
            throw new Error("Selecciona un documento");
          }
          console.log(
            "📤 [SEND DEBUG] Procesando documento:",
            selectedFile.name
          );
          const docUrl = await uploadFile(selectedFile);
          console.log(
            "📤 [SEND DEBUG] Path local de documento del backend:",
            docUrl
          );

          const docPayload = {
            receiver: formattedRecipient,
            isGroup,
            message: {
              document: { url: docUrl },
              caption: caption || undefined,
              mimetype: selectedFile.type || "application/octet-stream",
              fileName: selectedFile.name,
            },
          };
          console.log(
            "📤 [SEND DEBUG] Payload documento:",
            JSON.stringify(docPayload, null, 2)
          );
          response = await baileysAPI.sendDocumentMessage(
            sessionId,
            docPayload
          );
          break;

        case "location":
          if (!latitude || !longitude) {
            throw new Error("Ingresa las coordenadas");
          }
          response = await baileysAPI.sendLocationMessage(sessionId, {
            receiver: formattedRecipient,
            isGroup,
            message: {
              location: {
                degreesLatitude: parseFloat(latitude),
                degreesLongitude: parseFloat(longitude),
              },
            },
          });
          break;

        case "poll":
          if (
            !pollQuestion.trim() ||
            pollOptions.filter((opt) => opt.trim()).length < 2
          ) {
            throw new Error("Completa la pregunta y al menos 2 opciones");
          }
          response = await baileysAPI.sendPollMessage(sessionId, {
            receiver: formattedRecipient,
            isGroup,
            message: {
              poll: {
                name: pollQuestion,
                values: pollOptions.filter((opt) => opt.trim()),
                selectableCount: 1,
              },
            },
          });
          break;

        default:
          throw new Error("Tipo de mensaje no válido");
      }

      if (response.success) {
        toast({
          title: "Mensaje enviado",
          description: "El mensaje se envió correctamente",
        });
        resetForm();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("❌ [SEND DEBUG] Error capturado:", error);
      console.error("❌ [SEND DEBUG] Error tipo:", typeof error);
      console.error(
        "❌ [SEND DEBUG] Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      console.error(
        "❌ [SEND DEBUG] Error message:",
        error instanceof Error ? error.message : "No message"
      );

      toast({
        title: "❌ Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      console.log("✅ [SEND DEBUG] Proceso de envío finalizado");
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 12) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "La geolocalización no está disponible",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast({
          title: "Ubicación obtenida",
          description: "Se ha obtenido tu ubicación actual",
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: "No se pudo obtener la ubicación",
          variant: "destructive",
        });
      }
    );
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case "text":
        return <Send className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Mic className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "location":
        return <MapPin className="h-4 w-4" />;
      case "poll":
        return <Smile className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getMessageTypeIcon(messageType)}
          <span>Enviar Mensaje de WhatsApp</span>
        </CardTitle>
        <CardDescription>
          Envía mensajes a través de tu sesión de WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de tipo de mensaje */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { type: "text", label: "Texto", icon: Send },
            { type: "image", label: "Imagen", icon: Image },
            { type: "video", label: "Video", icon: Video },
            { type: "audio", label: "Audio", icon: Mic },
            { type: "document", label: "Documento", icon: FileText },
            { type: "location", label: "Ubicación", icon: MapPin },
            { type: "poll", label: "Encuesta", icon: Smile },
          ].map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={messageType === type ? "default" : "outline"}
              size="sm"
              className="flex flex-col items-center p-2 h-auto"
              onClick={() => setMessageType(type as MessageType)}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>

        {/* Destinatario */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recipient">Destinatario</Label>
            <Input
              id="recipient"
              placeholder="+573001234567"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="isGroup">Tipo</Label>
            <Select
              value={isGroup ? "group" : "individual"}
              onValueChange={(value) => setIsGroup(value === "group")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Grupo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contenido del mensaje según el tipo */}
        {messageType === "text" && (
          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Escribe tu mensaje aquí..."
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {["image", "video", "audio", "document"].includes(messageType) && (
          <div>
            <Label htmlFor="file">Archivo</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={
                  messageType === "image"
                    ? "image/*"
                    : messageType === "video"
                    ? "video/*"
                    : messageType === "audio"
                    ? "audio/*"
                    : "*/*"
                }
              />
              {selectedFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}

        {["image", "video", "document"].includes(messageType) && (
          <div>
            <Label htmlFor="caption">Descripción (opcional)</Label>
            <Input
              id="caption"
              placeholder="Descripción del archivo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        )}

        {messageType === "location" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="4.6097"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-74.0817"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Button onClick={getCurrentPosition} variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Usar mi ubicación actual
              </Button>
            </div>
          </div>
        )}

        {messageType === "poll" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pollQuestion">Pregunta</Label>
              <Input
                id="pollQuestion"
                placeholder="¿Cuál es tu respuesta?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            <div>
              <Label>Opciones</Label>
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Opción ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePollOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 12 && (
                  <Button onClick={addPollOption} variant="outline" size="sm">
                    Agregar opción
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={sendMessage}
          disabled={sending || !sessionId}
          className="w-full"
        >
          {sending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Enviando...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Enviar Mensaje</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
