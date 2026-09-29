// @ts-nocheck
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useTheme } from 'next-themes'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system', forcedTheme } = useTheme()

  return (
    <Sonner
      theme={(forcedTheme ?? theme) as ToasterProps['theme']}
      className='toaster group [&_div[data-content]]:w-full'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
