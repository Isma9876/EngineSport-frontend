// Stripe dibuja el formulario en un iframe: necesita valores reales, no variables CSS.
// Estos colores replican los del @theme de index.css.
export const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#f45124',
    colorBackground: '#ffffff',
    colorText: '#181a18',
    colorTextSecondary: '#686d67',
    colorDanger: '#d23c0e',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '4px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #dcddd6', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #f45124', boxShadow: '0 0 0 1px #f45124' },
    '.Label': { fontWeight: '500' },
    '.Tab': { border: '1px solid #dcddd6', boxShadow: 'none' },
    '.Tab--selected': { borderColor: '#f45124', color: '#f45124', boxShadow: '0 0 0 1px #f45124' },
  },
}

// Inter vive fuera del iframe, así que se le pasa la hoja de la fuente.
export const fonts = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
]