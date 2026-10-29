// Stripe dibuja el formulario en un iframe: necesita valores reales, no variables CSS.
// Estos colores replican los del @theme de index.css.
export const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#16784f',
    colorBackground: '#ffffff',
    colorText: '#0f3d2e',
    colorTextSecondary: '#686d67',
    colorDanger: '#b42318',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '4px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #dcddd6', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #16784f', boxShadow: '0 0 0 1px #16784f' },
    '.Label': { fontWeight: '500' },
    '.Tab': { border: '1px solid #dcddd6', boxShadow: 'none' },
    '.Tab--selected': { borderColor: '#16784f', color: '#16784f', boxShadow: '0 0 0 1px #16784f' },
  },
}

// Inter vive fuera del iframe, así que se le pasa la hoja de la fuente.
export const fonts = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
]