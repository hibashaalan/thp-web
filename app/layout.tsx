import './globals.css'

export const metadata = {
  title: 'AlmostCrackd — Caption Everything',
  description: 'Upload images, generate captions, vote on the best ones.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}