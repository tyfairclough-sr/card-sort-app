import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
  },
};

type Props = { content: string; className?: string };

const markdownClass =
  "max-w-none text-sm leading-relaxed [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:text-xs dark:[&_code]:bg-neutral-800 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_pre]:text-xs dark:[&_pre]:bg-neutral-900 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-600 dark:[&_blockquote]:border-neutral-600 dark:[&_blockquote]:text-neutral-400";

export function MarkdownContent({ content, className }: Props) {
  if (!content.trim()) return null;
  return (
    <div className={className ?? markdownClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
