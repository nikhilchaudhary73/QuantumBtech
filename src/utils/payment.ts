export const generateUPILink = (amount: number, description: string) => {
  const upiId = 'nikhil0872@ptyes';
  const name = encodeURIComponent('Nikhil Jaat');
  const note = encodeURIComponent(description);
  
  return `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
};
