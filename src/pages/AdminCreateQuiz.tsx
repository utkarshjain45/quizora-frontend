import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { createQuiz } from "@/api/apis";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { CreateQuizQuestionRequest } from "@/types/quiz";
import Navbar from "@/components/layout/Navbar";

const emptyQuestion = (): CreateQuizQuestionRequest => ({
  questionText: "",
  options: ["", ""],
  correctAnswerIndex: 0,
  points: 1,
});

export function AdminCreateQuiz() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<CreateQuizQuestionRequest[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    navigate("/signin");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-2 border-destructive/20 bg-card">
            <CardHeader>
              <CardTitle className="text-destructive">Access denied</CardTitle>
              <CardDescription>
                Only administrators can create quizzes. If you believe this is an error, contact your administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const addQuestion = () => {
    setQuestions((q) => [...q, emptyQuestion()]);
  };

  const updateQuestion = (index: number, field: keyof CreateQuizQuestionRequest, value: unknown) => {
    setQuestions((q) => {
      const next = [...q];
      (next[index] as unknown as Record<string, unknown>)[field] = value;
      return next;
    });
  };

  const setOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((q) => {
      const next = [...q];
      const opts = [...(next[qIndex].options || [])];
      opts[oIndex] = value;
      next[qIndex] = { ...next[qIndex], options: opts };
      return next;
    });
  }

  const addOption = (qIndex: number) => {
    setQuestions((q) => {
      const next = [...q];
      next[qIndex] = {
        ...next[qIndex],
        options: [...(next[qIndex].options || []), ""],
      };
      return next;
    });
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((q) => q.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      toast.error("Code and title are required.");
      return;
    }
    const validQuestions = questions.filter(
      (q) => q.questionText.trim() && q.options.filter((o) => o.trim()).length >= 2
    );
    if (validQuestions.length === 0) {
      toast.error("Add at least one question with at least two options.");
      return;
    }
    setLoading(true);
    try {
      await createQuiz({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        questions: validQuestions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.filter((o) => o.trim()).map((o) => o.trim()),
          correctAnswerIndex: q.correctAnswerIndex,
          points: q.points ?? 1,
        })),
      });
      toast.success("Quiz created successfully.");
      navigate("/");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(message || "Failed to create quiz. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-2 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="text-primary">Create a new quiz</CardTitle>
            <CardDescription>
              Only admins can create quizzes. Fill in the code, title, and add questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="code">Quiz code (unique)</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QUIZ001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quiz title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
                    Add question
                  </Button>
                </div>
                {questions.map((q, qIndex) => (
                  <Card key={qIndex} className="p-4 bg-secondary/30 border-border">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <Label className="text-sm">Question {qIndex + 1}</Label>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Question text"
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                      />
                      <div className="grid gap-1">
                        <Label className="text-xs">Options (correct answer index 0-based)</Label>
                        {(q.options || []).map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <Input
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => setOption(qIndex, oIndex, e.target.value)}
                            />
                            <span className="flex items-center text-muted-foreground text-sm">
                              {oIndex === q.correctAnswerIndex ? "✓ Correct" : ""}
                            </span>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                          Add option
                        </Button>
                      </div>
                      <div className="flex gap-4 items-center">
                        <Label className="text-xs">Correct index</Label>
                        <Input
                          type="number"
                          min={0}
                          max={Math.max(0, (q.options?.length ?? 1) - 1)}
                          value={q.correctAnswerIndex}
                          onChange={(e) => updateQuestion(qIndex, "correctAnswerIndex", parseInt(e.target.value, 10) || 0)}
                          className="w-20"
                        />
                        <Label className="text-xs">Points</Label>
                        <Input
                          type="number"
                          min={1}
                          value={q.points ?? 1}
                          onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value, 10) || 1)}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating…" : "Create quiz"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
