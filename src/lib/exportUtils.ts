
/**
 * Utility functions for exporting data to different formats
 */

/**
 * Convert data array to CSV format and trigger download
 * @param data Array of objects to be converted to CSV
 * @param filename Name of the file to be downloaded
 */
export function downloadAsCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || data.length === 0) {
    console.error('No data provided for CSV download');
    return;
  }

  // Get headers from the first object's keys
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        // Handle special cases for CSV format
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        
        // Convert to string and escape quotes
        cell = String(cell).replace(/"/g, '""');
        
        // Wrap with quotes if the cell contains commas, newlines, or quotes
        if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
          cell = `"${cell}"`;
        }
        
        return cell;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Append, click, and remove link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format the current date for filenames (YYYY-MM-DD)
 */
export function formatDateForFilename(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
