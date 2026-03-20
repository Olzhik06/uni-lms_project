'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Assignment, Submission, AiFeedback } from '@/lib/types';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Label, Skeleton } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import { Plus, Clock, Send, Sparkles, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

export default function AssignmentsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();

  const [cO, sCO] = useState(false);
  const [sO, sSO] = useState<string | null>(null);
  const [nT, sNT] = useState('');
  const [nD, sND] = useState('');
  const [nDu, sNDu] = useState('');
  const [nM, sNM] = useState('100');
  const [sT, sST] = useState('');
  const [sU, sSU] = useState('');

  // AI Feedback state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ['c-asgn', id],
    queryFn: () => api.get(`/courses/${id}/assignments`),
  });

  // Load student's own submissions
  const { data: mySubmissions } = useQuery<Submission[]>({
    queryKey: ['my-subs', id],
    queryFn: () => api.get(`/courses/${id}/my-submissions`),
    enabled: user?.role === 'STUDENT',
  });

  const submissionByAssignment = (mySubmissions || []).reduce<Record<string, Submission>>((acc, s) => {
    acc[s.assignmentId] = s;
    return acc;
  }, {});

  const cre = useMutation({
    mutationFn: (d: any) => api.post(`/courses/${id}/assignments`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['c-asgn', id] });
      toast({ title: 'Created' });
      sCO(false); sNT(''); sND(''); sNDu(''); sNM('100');
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const sub = useMutation({
    mutationFn: ({ aid, d }: { aid: string; d: any }) => api.post(`/assignments/${aid}/submit`, d),
    onSuccess: () => {
      toast({ title: 'Submitted' });
      sSO(null); sST(''); sSU('');
      qc.invalidateQueries({ queryKey: ['my-subs', id] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleAiFeedback = async (assignmentId: string) => {
    const submission = submissionByAssignment[assignmentId];
    if (!submission) {
      toast({ title: 'No submission yet', description: 'Submit your answer first to get AI feedback', variant: 'destructive' });
      return;
    }
    setAiFeedback(null);
    setAiOpen(true);
    setAiLoading(true);
    try {
      const result = await api.post<AiFeedback>('/ai/assignment-feedback', {
        assignmentId,
        submissionId: submission.id,
      });
      setAiFeedback(result);
    } catch (e: any) {
      toast({ title: 'AI unavailable', description: e.message, variant: 'destructive' });
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const canC = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isStu = user?.role === 'STUDENT';
  const past = (d: string) => new Date(d) < new Date();

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assignments</h2>
        {canC && (
          <Button onClick={() => sCO(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !assignments?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No assignments yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const hasSubmission = !!submissionByAssignment[a.id];
            return (
              <Card key={a.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{a.title}</h3>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {formatDateTime(a.dueAt)}</span>
                      <span>Max: {a.maxScore} pts</span>
                      {hasSubmission && <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Submitted</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {past(a.dueAt) ? <Badge variant="destructive">Past Due</Badge> : <Badge variant="success">Open</Badge>}
                    {isStu && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => sSO(a.id)}>Submit</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => handleAiFeedback(a.id)}
                          title={hasSubmission ? 'Get AI feedback on your submission' : 'Submit first to get AI feedback'}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Feedback
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={cO} onOpenChange={sCO}>
        <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={nT} onChange={e => sNT(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={nD} onChange={e => sND(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Due Date</Label><Input type="datetime-local" value={nDu} onChange={e => sNDu(e.target.value)} /></div>
            <div><Label>Max Score</Label><Input type="number" value={nM} onChange={e => sNM(e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={() => cre.mutate({ title: nT, description: nD, dueAt: new Date(nDu).toISOString(), maxScore: parseInt(nM) })} disabled={!nT || !nDu}>
            Create
          </Button>
        </div>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={!!sO} onOpenChange={() => sSO(null)}>
        <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Your answer</Label><Textarea value={sT} onChange={e => sST(e.target.value)} rows={4} /></div>
          <div><Label>URL (optional)</Label><Input value={sU} onChange={e => sSU(e.target.value)} /></div>
          <Button className="w-full gap-2" onClick={() => sub.mutate({ aid: sO!, d: { contentText: sT, contentUrl: sU || undefined } })} disabled={!sT && !sU}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
      </Dialog>

      {/* AI Feedback Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Feedback
          </DialogTitle>
        </DialogHeader>
        {aiLoading ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              Analyzing your submission...
            </div>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : aiFeedback && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">{aiFeedback.assessment}</div>

            {aiFeedback.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Strengths
                </p>
                <ul className="space-y-1">
                  {aiFeedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiFeedback.improvements.length > 0 && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" /> Areas to Improve
                </p>
                <ul className="space-y-1">
                  {aiFeedback.improvements.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiFeedback.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-2 text-blue-700">
                  <Lightbulb className="h-4 w-4" /> Suggestions
                </p>
                <ul className="space-y-1">
                  {aiFeedback.suggestions.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Generated by Claude AI · Not a substitute for teacher grading
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
