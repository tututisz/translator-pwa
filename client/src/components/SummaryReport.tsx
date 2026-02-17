import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface SummaryReportProps {
  summary: string;
  keyPoints: string[];
  errors: string[];
  statistics: {
    totalMessages: number;
    totalWords: number;
    duration: string;
    languagesUsed: string[];
  };
  onClose: () => void;
}

export function SummaryReport({
  summary,
  keyPoints,
  errors,
  statistics,
  onClose,
}: SummaryReportProps) {
  const handleDownload = () => {
    const content = `
CONVERSATION SUMMARY REPORT
==========================

Generated: ${new Date().toLocaleString()}

SUMMARY
-------
${summary}

KEY POINTS
----------
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

ERRORS & ISSUES
---------------
${errors.length > 0 ? errors.map((error, i) => `${i + 1}. ${error}`).join('\n') : 'No errors detected'}

STATISTICS
----------
Total Messages: ${statistics.totalMessages}
Total Words: ${statistics.totalWords}
Duration: ${statistics.duration}
Languages: ${statistics.languagesUsed.join(', ')}
    `.trim();

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', `conversation-summary-${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Conversation Summary</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-foreground/80">{summary}</p>
            </div>

            {/* Key Points */}
            {keyPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Points</h3>
                <ul className="space-y-2">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-accent font-semibold flex-shrink-0">•</span>
                      <span className="text-foreground/80">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-destructive">Errors & Issues</h3>
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-destructive font-semibold flex-shrink-0">⚠</span>
                      <span className="text-foreground/80">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-xl font-bold">{statistics.totalMessages}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Words</p>
                  <p className="text-xl font-bold">{statistics.totalWords}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold">{statistics.duration}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Languages</p>
                  <p className="text-xl font-bold">{statistics.languagesUsed.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
