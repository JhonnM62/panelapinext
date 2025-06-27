'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'
import { Menu, LogOut, User, Sun, Moon } from '@/components/ui/icons'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getDaysRemaining } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente',
    })
  }

  const daysRemaining = user ? getDaysRemaining(user.fechaFin) : 0

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Panel de Control
          </h1>
          
          {daysRemaining <= 7 && (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
              {daysRemaining === 0 ? 'Membresía expirada' : `${daysRemaining} días restantes`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden">
              <div className="w-full h-full bg-primary rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.nombrebot?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.nombrebot}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
