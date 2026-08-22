'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Users, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';

// ✅ Helper function to clean and format AI text
const formatAIText = (text) => {
  if (!text) return '';
  
  // Remove markdown bold/italic markers
  let cleaned = text
    .replace(/\*\*/g, '') // Remove **
    .replace(/\*/g, '')   // Remove *
    .replace(/__/g, '')   // Remove __
    .replace(/_/g, '');   // Remove _
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Split into sentences and format
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  
  // Format each sentence with proper capitalization
  const formatted = sentences.map((s, index) => {
    // Capitalize first letter
    const trimmed = s.trim();
    if (!trimmed) return '';
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return capitalized;
  }).filter(s => s);
  
  return formatted.join('. ');
};

// ✅ Helper to render text with proper formatting
const renderFormattedText = (text) => {
  if (!text) return null;
  
  // Split by periods, exclamation marks, question marks
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  
  if (sentences.length <= 1) {
    return <p className="text-sm text-slate-700">{text}</p>;
  }
  
  return (
    <ul className="space-y-1.5">
      {sentences.map((sentence, index) => {
        const trimmed = sentence.trim();
        if (!trimmed) return null;
        // Clean any remaining markdown
        const clean = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        return (
          <li key={index} className="text-sm text-slate-700 flex items-start space-x-2">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{clean}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default function AIExplanation({ 
  analysis, 
  isLoading = false,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  console.log('[AIExplanation] Received analysis:', analysis);
  console.log('[AIExplanation] isLoading:', isLoading);

  // If loading, show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-amber-500 animate-pulse" />
            AI Risk Analysis
            <Badge variant="outline" className="ml-2 text-xs">
              Generating...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Generating AI insights...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If analysis exists, display it
  if (analysis) {
    const structured = analysis.structured || {};
    
    // ✅ Clean the text content
    const explanation = formatAIText(structured.explanation || analysis.analysis || '');
    const affected = formatAIText(structured.affected || '');
    const recommendations = formatAIText(structured.recommendations || '');
    
    const hasExplanation = explanation.length > 0;
    const hasAffected = affected.length > 0;
    const hasRecommendations = recommendations.length > 0;
    
    const isFallback = analysis.metadata?.source === 'fallback';
    const isGroq = analysis.metadata?.source === 'groq';
    const isCache = analysis.metadata?.source === 'cache';

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              AI Risk Analysis
              {isCache && (
                <Badge variant="outline" className="ml-2 text-[10px] text-blue-500 border-blue-200">
                  Cached
                </Badge>
              )}
              {isFallback && (
                <Badge variant="outline" className="ml-2 text-[10px] text-yellow-500 border-yellow-200">
                  Fallback
                </Badge>
              )}
              {isGroq && (
                <Badge variant="outline" className="ml-2 text-[10px] text-green-500 border-green-200">
                  AI Powered
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isExpanded && (
            <div className="space-y-4">
              {/* Risk Explanation */}
              {hasExplanation && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
                        Risk Explanation
                      </p>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {renderFormattedText(explanation)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Who May Be Affected */}
              {hasAffected && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">
                        Who May Be Affected
                      </p>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {renderFormattedText(affected)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {hasRecommendations && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">
                        Recommendations
                      </p>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {renderFormattedText(recommendations)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw analysis fallback (if no structured sections) */}
              {!hasExplanation && !hasAffected && !hasRecommendations && analysis.analysis && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {formatAIText(analysis.analysis)}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {analysis.metadata && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-2 mt-2">
                  <span>Generated: {new Date(analysis.metadata.timestamp).toLocaleString()}</span>
                  {analysis.metadata.model && <span>Model: {analysis.metadata.model}</span>}
                  {analysis.metadata.tokens && <span>Tokens: {analysis.metadata.tokens}</span>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If no analysis, show placeholder
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
          AI Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-slate-500">
          <div className="text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
<p className="text-sm">Click &quot;Analyze Location&quot; to get AI insights</p>
            <p className="text-xs mt-1">Powered by Groq AI</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}