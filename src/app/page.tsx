// src/app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "@/components/ui/icons";
import { Menu, X } from "lucide-react";

// Iconos SVG simples inline
const Smartphone = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeWidth={2}/>
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2}/>
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeWidth={2}/>
  </svg>
);

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12,22s8-4 8-10V5l-8-3-8,3v7c0,6 8,10 8,10z" strokeWidth={2}/>
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth={2}/>
    <circle cx="9" cy="7" r="4" strokeWidth={2}/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth={2}/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth={2}/>
  </svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 3v18h18" strokeWidth={2}/>
    <path d="M18 17V9" strokeWidth={2}/>
    <path d="M13 17V5" strokeWidth={2}/>
    <path d="M8 17v-3" strokeWidth={2}/>
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth={2}/>
    <polyline points="22,4 12,14.01 9,11.01" strokeWidth={2}/>
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth={2}/>
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2}/>
    <polyline points="12,5 19,12 12,19" strokeWidth={2}/>
  </svg>
);

const PlayCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2}/>
    <polygon points="10,8 16,12 10,16" fill="currentColor"/>
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" strokeWidth={2}/>
    <path d="M20 3v4" strokeWidth={2}/>
    <path d="M22 5h-4" strokeWidth={2}/>
    <path d="M4 17v2" strokeWidth={2}/>
    <path d="M5 18H3" strokeWidth={2}/>
  </svg>
);

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const features = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Mensajería Automatizada",
      description: "Envía mensajes masivos, respuestas automáticas y campañas programadas",
      color: "text-blue-500",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics Avanzados",
      description: "Monitorea el rendimiento de tus campañas en tiempo real",
      color: "text-green-500",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Gestión de Contactos",
      description: "Organiza y segmenta tus contactos para campañas más efectivas",
      color: "text-purple-500",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Seguridad Garantizada",
      description: "Protección avanzada contra bloqueos y suspensiones",
      color: "text-red-500",
    },
  ];

  const testimonials = [
    {
      name: "María González",
      company: "E-commerce Solutions",
      content: "Increíble herramienta! Mis ventas aumentaron 300% en solo 2 meses.",
      rating: 5,
    },
    {
      name: "Carlos Rodríguez",
      company: "Marketing Digital",
      content: "La automatización me ahorra 5 horas diarias. Totalmente recomendado.",
      rating: 5,
    },
    {
      name: "Ana Martínez",
      company: "Consultora Inmobiliaria",
      content: "Perfecto para seguimiento de clientes. Muy fácil de usar.",
      rating: 5,
    },
  ];

  const stats = [
    { number: "50K+", label: "Mensajes enviados" },
    { number: "1.2K+", label: "Usuarios activos" },
    { number: "99.9%", label: "Uptime garantizado" },
    { number: "24/7", label: "Soporte técnico" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-primary">
                <Smartphone className="h-8 w-8" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WhatsApp Pro
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Precios
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col space-y-3 pt-4">
                <Link
                  href="/pricing"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Precios
                </Link>
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Comenzar Gratis
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-6 py-3 rounded-full mb-8">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ¡Nuevo! Automatización con IA
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              Automatiza tu WhatsApp y{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Multiplica tus Ventas
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              La herramienta más avanzada para gestionar WhatsApp Business.
              Envía mensajes masivos, automatiza respuestas y aumenta tus
              conversiones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 h-auto"
                onClick={() => router.push("/auth/register")}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Comenzar Gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => router.push("/pricing")}
              >
                Ver Precios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Todo lo que necesitas para dominar WhatsApp Business
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    activeFeature === index
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : ""
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${feature.color}`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-white text-xl font-semibold">
                  {features[activeFeature].title}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Qué Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Miles de empresas confían en nosotros
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                    "{t.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              ¿Listo para Revolucionar tu Negocio?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a miles de empresas que ya están automatizando su WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto"
                onClick={() => router.push("/auth/register")}
              >
                Comenzar Ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6 h-auto"
                onClick={() => router.push("/pricing")}
              >
                Ver Planes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Smartphone className="h-6 w-6" />
                <span className="text-lg font-bold">WhatsApp Pro</span>
              </div>
              <p className="text-gray-400">
                La herramienta más avanzada para automatizar WhatsApp Business.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Precios
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Funcionalidades
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    Documentación
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WhatsApp Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
