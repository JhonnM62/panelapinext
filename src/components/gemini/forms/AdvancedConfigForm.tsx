import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Settings, Globe, Clock, MessageSquare } from "lucide-react";
import type { GeminiFormData } from "../hooks/useGeminiForm";

interface AdvancedConfigFormProps {
  formData: GeminiFormData;
  onFieldChange: <K extends keyof GeminiFormData>(
    field: K,
    value: GeminiFormData[K]
  ) => void;
}

const countries = [
  { value: "colombia", label: "Colombia" },
  { value: "mexico", label: "México" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "peru", label: "Perú" },
  { value: "venezuela", label: "Venezuela" },
  { value: "españa", label: "España" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export default function AdvancedConfigForm({
  formData,
  onFieldChange,
}: AdvancedConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          Configuración Avanzada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración de Región */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pais" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              País
            </Label>
            <Select
              value={formData.pais}
              onValueChange={(value) => onFieldChange("pais", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idioma">Idioma</Label>
            <Select
              value={formData.idioma}
              onValueChange={(value) => onFieldChange("idioma", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configuración de Mensajes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="numerodemensajes"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Contexto de Mensajes: {formData.numerodemensajes}
            </Label>
            <Slider
              min={3}
              max={20}
              step={1}
              value={[formData.numerodemensajes]}
              onValueChange={(value) =>
                onFieldChange("numerodemensajes", value[0])
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Número de mensajes previos que recordará el bot
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay_seconds" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Delay de Respuesta: {formData.delay_seconds}s
            </Label>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[formData.delay_seconds]}
              onValueChange={(value) =>
                onFieldChange("delay_seconds", value[0])
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Tiempo de espera antes de responder
            </p>
          </div>
        </div>

        {/* Configuración del Servidor */}
        <div className="space-y-2">
          <Label htmlFor="server">Servidor Backend</Label>
          <Input
            id="server"
            value={formData.server}
            onChange={(e) => onFieldChange("server", e.target.value)}
            placeholder="https://backend.autosystemprojects.site"
            className="transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground">
            URL del servidor backend para callbacks y webhooks
          </p>
        </div>

        {/* Configuración de Timeouts */}
        <div className="space-y-2">
          <Label htmlFor="pause_timeout_minutes">
            Timeout de Pausa: {formData.pause_timeout_minutes} minutos
          </Label>
          <Slider
            min={5}
            max={120}
            step={5}
            value={[formData.pause_timeout_minutes]}
            onValueChange={(value) =>
              onFieldChange("pause_timeout_minutes", value[0])
            }
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Tiempo máximo de inactividad antes de pausar el bot
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
