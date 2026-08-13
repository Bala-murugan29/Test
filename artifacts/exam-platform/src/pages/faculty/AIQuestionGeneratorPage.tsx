import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGenerateAiQuestions } from "@workspace/api-client-react";
import { notifyError } from "@/hooks/queries/mutation-helpers";
import { Textarea } from "@/components/ui/textarea";

export function AIQuestionGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [type, setType] = useState<"MCQ" | "CODING">("MCQ");
  const [count, setCount] = useState("1");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const { toast } = useToast();

  const generateMutation = useGenerateAiQuestions({
    mutation: {
      onSuccess: (data) => {
        setGeneratedQuestions(data);
        toast({
          title: "Questions generated!",
          description: `Successfully generated ${data.length} questions.`,
        });
      },
      onError: (error) => {
        notifyError(error, "Generation failed");
      },
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({ title: "Topic is required", variant: "destructive" });
      return;
    }
    
    generateMutation.mutate({
      data: {
        topic,
        difficulty: parseInt(difficulty, 10),
        type,
        count: parseInt(count, 10),
      }
    });
  };

  const handleSaveToBank = (qIndex: number) => {
    // In a real app, wire this to createMcqQuestion or createCodingQuestion API hooks.
    toast({
      title: "Saved to Question Bank",
      description: "This feature is currently a placeholder for the actual API call.",
    });
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== qIndex));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Question Generator</h2>
        <p className="text-muted-foreground">
          Generate new questions for your courses using artificial intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Generator Settings</CardTitle>
            <CardDescription>Configure the AI parameters</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g. React Hooks, Binary Trees..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={generateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <Select value={type} onValueChange={(v: "MCQ" | "CODING") => setType(v)} disabled={generateMutation.isPending}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">Multiple Choice</SelectItem>
                    <SelectItem value="CODING">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={generateMutation.isPending}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        Level {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Number of Questions</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  disabled={generateMutation.isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Generating..." : "Generate Questions"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Preview</h3>
          {generatedQuestions.length === 0 && !generateMutation.isPending && (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed p-8 text-center text-muted-foreground">
              Configure settings and click generate to see questions here.
            </div>
          )}
          {generateMutation.isPending && (
            <div className="flex h-[200px] items-center justify-center rounded-md border p-8 text-center text-muted-foreground">
              Waiting for AI model...
            </div>
          )}
          
          <div className="space-y-4">
            {generatedQuestions.map((q, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{q.title || `Generated Question ${index + 1}`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Prompt</Label>
                    <Textarea value={q.prompt || ""} readOnly className="mt-1" />
                  </div>
                  
                  {type === "MCQ" && q.options && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <ul className="list-disc pl-5 space-y-1">
                        {q.options.map((opt: any, i: number) => (
                          <li key={i} className={i === q.correctOptionIndex ? "font-bold text-green-600" : ""}>
                            {opt.text} {i === q.correctOptionIndex && "(Correct)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {type === "CODING" && (
                    <div className="space-y-4">
                      {q.starterCode && (
                        <div>
                          <Label>Starter Code</Label>
                          <pre className="mt-1 bg-muted p-2 rounded-md overflow-x-auto text-sm">
                            {q.starterCode}
                          </pre>
                        </div>
                      )}
                      
                      {q.sampleInput && (
                        <div>
                          <Label>Sample Input</Label>
                          <pre className="mt-1 bg-muted p-2 rounded-md overflow-x-auto text-sm">{q.sampleInput}</pre>
                        </div>
                      )}
                      
                      {q.sampleOutput && (
                        <div>
                          <Label>Sample Output</Label>
                          <pre className="mt-1 bg-muted p-2 rounded-md overflow-x-auto text-sm">{q.sampleOutput}</pre>
                        </div>
                      )}

                      {q.testCases && q.testCases.length > 0 && (
                        <div>
                          <Label>Test Cases</Label>
                          <div className="mt-1 space-y-2">
                            {q.testCases.map((tc: any, i: number) => (
                              <div key={i} className="border rounded-md p-2 text-sm bg-muted/50">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-xs">Test Case {i + 1}</span>
                                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${tc.isHidden ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {tc.isHidden ? 'Private' : 'Public'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Input:</span>
                                    <code className="bg-background px-1 py-0.5 rounded break-all">{tc.input}</code>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Expected:</span>
                                    <code className="bg-background px-1 py-0.5 rounded break-all">{tc.expectedOutput}</code>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {q.explanation && (
                    <div>
                      <Label>Explanation</Label>
                      <p className="text-sm mt-1">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="outline" onClick={() => handleSaveToBank(index)}>
                    Save to Question Bank
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
