"use client";

import { useId, useState, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, X } from "lucide-react";
import ImageField from "./ImageField";
import {
  buildTemplateFormData,
  useAdminCreateTemplateMutation,
  useAdminUpdateTemplateMutation,
  type AdminTemplate,
  type TemplateFormData,
} from "@/services/adminTemplateService";
import { CATEGORY_LABELS, type TemplateCategory } from "@/services/templateService";
import { getApiErrorMessage } from "@/lib/auth";

const MAX_PREVIEWS = 8;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TemplateCategory[];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const control = (hasError: boolean) =>
  `w-full border bg-white px-4 py-3.5 text-brand-deep outline-none transition-colors placeholder:text-brand-deep/35 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 disabled:bg-brand-cream disabled:text-brand-deep/50 ${hasError ? "border-destructive" : "border-input"}`;

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-brand-deep">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function TextInput({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => <input id={id} aria-invalid={Boolean(error)} className={control(Boolean(error))} {...rest} />}
    </Field>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-brand-deep">{label}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-teal" : "bg-brand-deep/20"}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-5 border border-border bg-white p-6 sm:p-8">
    <h2 className="font-serif text-2xl text-brand-deep">{title}</h2>
    {children}
  </section>
);

type Errors = Record<string, string>;

export default function TemplateForm({ template }: { template?: AdminTemplate }) {
  const router = useRouter();
  const editing = Boolean(template);
  const [createTemplate, { isLoading: creating }] = useAdminCreateTemplateMutation();
  const [updateTemplate, { isLoading: updating }] = useAdminUpdateTemplateMutation();
  const saving = creating || updating;

  const [name, setName] = useState(template?.templateName ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [category, setCategory] = useState<TemplateCategory>(template?.category ?? "wedding");
  const [type, setType] = useState<"card" | "video">(template?.templateType ?? "card");
  const [isFree, setIsFree] = useState(template?.is_free ?? false);
  const [price, setPrice] = useState(template ? String(template.price) : "");
  const [maxPhotos, setMaxPhotos] = useState(String(template?.max_photos ?? 0));
  const [requiresVideo, setRequiresVideo] = useState(template?.requires_video ?? false);
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [fields, setFields] = useState<string[]>(template?.supportedFields ?? []);
  const [fieldInput, setFieldInput] = useState("");
  const [manifestText, setManifestText] = useState(JSON.stringify(template?.manifest ?? {}, null, 2));

  const [thumbExisting, setThumbExisting] = useState<string[]>(template?.thumbnail_url ? [template.thumbnail_url] : []);
  const [thumbFiles, setThumbFiles] = useState<File[]>([]);
  const [previewExisting, setPreviewExisting] = useState<string[]>(template?.preview_images ?? []);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");

  const onName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const addField = () => {
    const parts = fieldInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) setFields((prev) => Array.from(new Set([...prev, ...parts])));
    setFieldInput("");
  };
  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addField();
    } else if (e.key === "Backspace" && !fieldInput && fields.length) {
      setFields((prev) => prev.slice(0, -1));
    }
  };

  const formatManifest = () => {
    try {
      setManifestText(JSON.stringify(JSON.parse(manifestText), null, 2));
    } catch {
      setErrors((e) => ({ ...e, manifest: "This isn't valid JSON yet." }));
    }
  };

  const validate = () => {
    const err: Errors = {};
    if (name.trim().length < 2) err.name = "Enter a name of at least 2 characters.";
    if (!SLUG_RE.test(slug)) err.slug = "Use lowercase letters, numbers and single hyphens, for example royal-wedding.";
    if (!isFree && !(Number(price) > 0)) err.price = "Enter a price greater than 0, or mark the template as free.";
    if (!Number.isInteger(Number(maxPhotos)) || Number(maxPhotos) < 0 || Number(maxPhotos) > 50) err.maxPhotos = "Enter a whole number from 0 to 50.";
    if (thumbExisting.length + thumbFiles.length === 0) err.thumbnail = "Add a thumbnail image.";
    if (previewExisting.length + previewFiles.length > MAX_PREVIEWS) err.previews = `Use at most ${MAX_PREVIEWS} preview images.`;
    try {
      const parsed: unknown = JSON.parse(manifestText || "{}");
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) err.manifest = "The manifest must be a JSON object, like { }.";
    } catch {
      err.manifest = "This isn't valid JSON yet.";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) {
      document.getElementById("template-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const data: TemplateFormData = {
      templateName: name.trim(),
      slug,
      category,
      templateType: type,
      price: isFree ? 0 : Number(price),
      currency: "INR",
      is_free: isFree,
      max_photos: Number(maxPhotos),
      requires_video: requiresVideo,
      is_active: isActive,
      supportedFields: fields,
      manifest: JSON.parse(manifestText || "{}") as Record<string, unknown>,
      ...(editing && { existingPreviewImages: previewExisting }),
    };
    const body = buildTemplateFormData(data, thumbFiles[0], previewFiles);

    try {
      if (template) await updateTemplate({ id: template.id, body }).unwrap();
      else await createTemplate(body).unwrap();
      router.push("/admin/templates");
    } catch (err) {
      setServerError(getApiErrorMessage(err, "We couldn't save this template. Please try again."));
      document.getElementById("template-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <form id="template-form" onSubmit={onSubmit} noValidate className="scroll-mt-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/templates" className="text-sm text-brand-deep/70 hover:text-brand-deep">
            ← All templates
          </Link>
          <h1 className="mt-2 font-serif text-4xl text-brand-deep">{editing ? `Edit ${template?.templateName}` : "New template"}</h1>
        </div>
      </div>

      {serverError && (
        <p role="alert" className="mb-6 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Basics">
            <TextInput label="Name" value={name} onChange={(e) => onName(e.target.value)} placeholder="Royal Wedding" error={errors.name} />
            <TextInput
              label="Slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="royal-wedding"
              error={errors.slug}
              hint={editing ? "Changing the slug changes the template's public link." : "Used in the public link: /templates/your-slug"}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category">
                {(id) => (
                  <div className="relative">
                    <select id={id} value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)} className={`${control(false)} appearance-none pr-11`}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-brand-deep/50" />
                  </div>
                )}
              </Field>
              <Field label="Type">
                {(id) => (
                  <div className="relative">
                    <select id={id} value={type} onChange={(e) => setType(e.target.value as "card" | "video")} className={`${control(false)} appearance-none pr-11`}>
                      <option value="card">Card</option>
                      <option value="video">Video</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-brand-deep/50" />
                  </div>
                )}
              </Field>
            </div>
          </Card>

          <Card title="Pricing and limits">
            <Toggle label="Free template" hint="Free templates have no download charge." checked={isFree} onChange={setIsFree} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput label="Price (INR)" type="number" inputMode="decimal" min={0} step="1" disabled={isFree} value={isFree ? "0" : price} onChange={(e) => setPrice(e.target.value)} placeholder="249" error={errors.price} />
              <TextInput label="Max photos" type="number" inputMode="numeric" min={0} max={50} value={maxPhotos} onChange={(e) => setMaxPhotos(e.target.value)} error={errors.maxPhotos} hint="How many photos a customer can add." />
            </div>
            <Toggle label="Requires a video" hint="Customers must provide a video for this template." checked={requiresVideo} onChange={setRequiresVideo} />
          </Card>

          <Card title="Customer fields">
            <Field label="Supported fields" hint="Press Enter or comma to add. Example: brideName, groomName, eventDate">
              {(id) => (
                <div className={`flex flex-wrap items-center gap-2 border bg-white p-2 focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/30 ${"border-input"}`}>
                  {fields.map((f) => (
                    <span key={f} className="flex items-center gap-1.5 bg-brand-cream px-2.5 py-1 text-sm text-brand-deep">
                      {f}
                      <button type="button" aria-label={`Remove ${f}`} onClick={() => setFields((prev) => prev.filter((x) => x !== f))} className="text-brand-deep/50 hover:text-brand-deep">
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  <input id={id} value={fieldInput} onChange={(e) => setFieldInput(e.target.value)} onKeyDown={onFieldKey} onBlur={addField} placeholder={fields.length ? "" : "Add a field"} className="min-w-32 flex-1 bg-transparent px-2 py-1.5 outline-none placeholder:text-brand-deep/35" />
                </div>
              )}
            </Field>

            <Field label="Manifest (JSON)" error={errors.manifest} hint="Layout and styling data used to render this template.">
              {(id) => (
                <>
                  <textarea id={id} rows={10} spellCheck={false} value={manifestText} onChange={(e) => setManifestText(e.target.value)} aria-invalid={Boolean(errors.manifest)} className={`${control(Boolean(errors.manifest))} resize-y font-mono text-sm`} />
                  <button type="button" onClick={formatManifest} className="self-start text-sm text-brand-deep underline underline-offset-4">
                    Format JSON
                  </button>
                </>
              )}
            </Field>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Status">
            <Toggle label="Active" hint="Inactive templates are hidden from customers." checked={isActive} onChange={setIsActive} />
          </Card>

          <Card title="Images">
            <ImageField label="Thumbnail" hint="Shown on the templates page." max={1} existing={thumbExisting} onExistingChange={setThumbExisting} files={thumbFiles} onFilesChange={setThumbFiles} error={errors.thumbnail} />
            <ImageField label="Preview images" hint="Shown in the gallery on the template page." max={MAX_PREVIEWS} existing={previewExisting} onExistingChange={setPreviewExisting} files={previewFiles} onFilesChange={setPreviewFiles} error={errors.previews} />
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-3 border-t border-border bg-brand-cream/95 py-4 backdrop-blur-sm">
        <Link href="/admin/templates" className="border border-brand-deep px-6 py-3 text-sm text-brand-deep hover:bg-brand-deep hover:text-white">
          Cancel
        </Link>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-brand-deep px-7 py-3 text-sm font-medium text-white hover:bg-brand-teal disabled:opacity-60">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : editing ? "Save changes" : "Create template"}
        </button>
      </div>
    </form>
  );
}
