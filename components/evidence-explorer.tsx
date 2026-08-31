'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

import { EvidencePill } from '@/components/site-shell';

type Project = {
  project_id: string;
  name: string;
  estimated_cost_cad: number | null;
  municipality: string;
  stage: string;
  developer: string;
  project_website: string | null;
  location_precision: string;
  ai_relevance: string;
  source_evidence_status: string;
  classification_evidence_status: string;
};

export function EvidenceExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesView = view === 'all' || project.ai_relevance === view;
      const matchesQuery = !needle || `${project.name} ${project.municipality} ${project.developer}`.toLowerCase().includes(needle);
      return matchesView && matchesQuery;
    });
  }, [projects, query, view]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-[#d8dfda] pb-6 md:flex-row md:items-center md:justify-between">
        <label className="flex h-10 max-w-md flex-1 items-center gap-2 rounded-lg border border-[#c9d3cd] bg-white px-3">
          <Search className="size-4 text-[#68807a]" />
          <span className="sr-only">Search projects</span>
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-[#91a09c]" onChange={(event) => setQuery(event.target.value)} placeholder="Search project, municipality or developer" value={query} />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Project classification filter">
          {[['all', 'All'], ['core_data_centre', 'Core facilities'], ['enabling_power', 'Enabling power']].map(([value, label]) => (
            <button className={`rounded-full border px-3 py-1.5 text-xs font-medium ${view === value ? 'border-[#1d6e68] bg-[#dceee9] text-[#155850]' : 'border-[#cbd4cf] bg-white text-[#52645f]'}`} key={value} onClick={() => setView(value)} type="button">{label}</button>
          ))}
        </div>
      </div>
      <p className="py-4 font-mono text-xs text-[#52645f]">{filtered.length} records · classification is inferred from a controlled project-name vocabulary</p>
      <div className="grid gap-3">
        {filtered.map((project) => (
          <article className="grid gap-4 rounded-xl border border-[#d6ddd8] bg-[#fbfaf5] p-4 sm:grid-cols-[1fr_auto] sm:p-5" key={project.project_id}>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2"><EvidencePill status="observed" /><EvidencePill status="inferred" /><span className="font-mono text-[10px] text-[#52645f]">{project.project_id}</span></div>
              <h2 className="text-base font-medium text-[#153540]">{project.name}</h2>
              <p className="mt-1 text-sm text-[#52645f]">{project.municipality} · {project.developer || 'Developer not reported'} · {project.stage}</p>
              <p className="mt-2 text-xs text-[#52645f]">Location: {project.location_precision}. Source fields are observed; AI relevance is an inference.</p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-center">
              <p className="font-mono text-sm font-semibold text-[#1b5c59]">{project.estimated_cost_cad ? `$${formatBillions(project.estimated_cost_cad)}B` : 'Cost not reported'}</p>
              {project.project_website ? <a className="inline-flex items-center gap-1 text-xs font-medium text-[#2b716a] hover:underline" href={project.project_website} rel="noreferrer" target="_blank">Project source <ExternalLink className="size-3" /></a> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatBillions(value: number) {
  return (value / 1_000_000_000).toFixed(value >= 1_000_000_000 ? 2 : 3).replace(/0+$/, '').replace(/\.$/, '');
}
