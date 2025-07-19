'use client'

import { Session } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2 } from '@/components/ui/icons'
import { StatusIndicator } from './StatusIndicator'
import { useState } from 'react'
import { ConfirmationModal } from './ConfirmationModal'
import { useToast } from '@/components/ui/use-toast'

interface SessionCardProps {
  session: Session;
  isSelected: boolean;
  isRefreshing: boolean;
  onSelect: (sessionId: string) => void;
  onRefresh: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionCard({ 
  session, 
  isSelected, 
  isRefreshing, 
  onSelect, 
  onRefresh, 
  onDelete 
}: SessionCardProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(session.id)
      toast({
        title: "Sesión eliminada",
        description: `La sesión ${session.id} ha sido eliminada exitosamente.`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la sesión. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(session.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div>
              <CardTitle className="text-lg">{session.id}</CardTitle>
              {session.phoneNumber && (
                <p className="text-sm text-muted-foreground">
                  {session.phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <StatusIndicator session={session} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Información de la sesión */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creada:</span>
              <span>{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Última actividad:</span>
              <span>{session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              onClick={() => onRefresh(session.id)}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={handleDeleteClick}
              variant="destructive"
              size="sm"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Sesión"
        description={`¿Estás seguro de que deseas eliminar la sesión ${session.id}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
      />
    </Card>
  )
}
