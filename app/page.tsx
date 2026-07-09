import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold">Team Portal — Theme Preview</h1>
      <p className="mb-10 text-sm text-fg-muted">
        This page exists only to check the theme and components. Safe to replace.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Save changes</Button>
          <Button variant="secondary">Publish</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete project</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Badges
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Published</Badge>
          <Badge variant="info">Admin</Badge>
          <Badge variant="warning">Pending review</Badge>
          <Badge variant="danger">Draft removed</Badge>
          <Badge variant="neutral">Editor</Badge>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Form
        </h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>New project</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <Input label="Project title" placeholder="e.g. Brand identity for Acme" />
            <Input label="Client name" placeholder="e.g. Acme Inc." />
            <Input label="Broken field" error="This field is required" />
            <Button variant="primary">Create project</Button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Card
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Website Redesign — Acme Inc.</CardTitle>
            <Badge variant="success">Published</Badge>
          </CardHeader>
          <CardDescription>
            Uploaded by Sarah on Jul 5. 12 images, 1 PDF case study attached.
          </CardDescription>
        </Card>
      </section>
    </main>
  );
}
