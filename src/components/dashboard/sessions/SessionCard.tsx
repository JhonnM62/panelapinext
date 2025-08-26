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
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(session.id)}
              className="h-4 w-4 rounded border-gray-300 mt-1 sm:mt-0 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg truncate">{session.id}</CardTitle>
              {session.phoneNumber && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
        <div className="space-y-2 sm:space-y-3">
          {/* Información de la sesión */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Creada:</span>
              <span className="text-right truncate">{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Última actividad:</span>
              <span className="text-right truncate">{session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => onRefresh(session.id)}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={handleDeleteClick}
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="flex-shrink-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
