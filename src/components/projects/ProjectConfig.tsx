"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/actions/projects";
import type { ProjectFormValues } from "@/lib/schemas";
import { ColorPickerPopover } from "@/components/ui/ColorPicker";
import { cn } from "@/lib/utils";
import {
	Stepper,
	StepperItem,
	StepperTrigger,
	StepperIndicator,
	StepperSeparator,
	StepperTitle,
	StepperNav,
	StepperContent,
} from "@/lib/reui/stepper";

const PRESET_COLORS = [
	{ value: "#0d74f6", label: "Dodger Blue" },
	{ value: "#2563eb", label: "Blue" },
	{ value: "#16a34a", label: "Green" },
	{ value: "#d97706", label: "Amber" },
	{ value: "#db2777", label: "Pink" },
	{ value: "#7c3aed", label: "Violet" },
	{ value: "#0891b2", label: "Cyan" },
	{ value: "#dc2626", label: "Red" },
];

const ID_TO_HEX: Record<string, string> = {
	dodgerBlue: "#0d74f6",
	indigo: "#4f46e5",
	emerald: "#059669",
	amber: "#d97706",
	rose: "#db2777",
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const LockIcon = (props: React.ComponentProps<"svg">) => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
		<rect x="3" y="11" width="18" height="11" rx="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>
);
const EyeIcon = ({ off, ...props }: { off?: boolean } & React.ComponentProps<"svg">) =>
	off ? (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	) : (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
		</svg>
	);
const PlusIcon = (props: React.ComponentProps<"svg">) => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
		<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
	</svg>
);
const TrashIcon = (props: React.ComponentProps<"svg">) => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
		<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
	</svg>
);

const CheckIcon = (props: React.ComponentProps<"svg">) => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<polyline points="20 6 9 17 4 12"></polyline>
	</svg>
);

export function ProjectConfig({
	mode,
	initial,
}: {
	mode: "create" | "edit";
	initial?: Partial<ProjectFormValues & { id: string }>;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [showSecret, setShowSecret] = useState(false);
	const [step, setStep] = useState(1);
	const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

	const initialColor =
		(initial?.color?.startsWith("#") ? initial.color : ID_TO_HEX[initial?.color || "dodgerBlue"]) || "#0d74f6";

	const [data, setData] = useState<ProjectFormValues>({
		name: initial?.name || "",
		description: initial?.description || "",
		color: initialColor,
		baseUrl: initial?.baseUrl || "",
		auth: {
			type: initial?.auth?.type || "bearer",
			value: initial?.auth?.value || "",
			headerName: initial?.auth?.headerName || "Authorization",
			username: initial?.auth?.username || "",
			tokenUrl: initial?.auth?.tokenUrl || "",
			clientId: initial?.auth?.clientId || "",
		},
		endpoints: initial?.endpoints || [
			{ id: "create", label: "Create User", method: "POST", path: "/users" },
			{ id: "update", label: "Update User", method: "PATCH", path: "/users/id" },
		],
	});

	const [pickerAnchor, setPickerAnchor] = useState<{ top: number; left: number } | null>(null);
	const customBtnRef = useRef<HTMLButtonElement>(null);

	const themeColor = data.color || "#0d74f6";
	const isCustomColor = !PRESET_COLORS.some((c) => c.value === themeColor.toLowerCase());
	const hexValid = HEX_RE.test(themeColor);

	const togglePicker = () => {
		if (pickerAnchor) {
			setPickerAnchor(null);
			return;
		}
		const rect = customBtnRef.current?.getBoundingClientRect();
		if (rect) setPickerAnchor({ top: rect.bottom + 8, left: rect.left });
	};

	useEffect(() => {
		if (!pickerAnchor) return;
		const handler = (e: MouseEvent) => {
			if (customBtnRef.current?.contains(e.target as Node)) return;
			setPickerAnchor(null);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [pickerAnchor]);

	const handleAuthChange = (field: string, val: string) => {
		setData({ ...data, auth: { ...data.auth, [field]: val } });
	};

	const handleEndpointChange = (id: string, field: string, val: string) => {
		const next = (data.endpoints || []).map((e) => (e.id === id ? { ...e, [field]: val } : e));
		setData({ ...data, endpoints: next });
	};

	const addEndpoint = () => {
		const id = Math.random().toString(36).substring(7);
		const next = [...(data.endpoints || []), { id, label: "", method: "POST", path: "" }];
		setData({ ...data, endpoints: next });
	};

	const removeEndpoint = (id: string) => {
		const next = (data.endpoints || []).filter((e) => e.id !== id);
		setData({ ...data, endpoints: next });
	};

	const canGoNext = () => {
		if (step === 1) return data.name?.trim().length > 0 && hexValid;

		if (step === 2) {
			if (!data.baseUrl?.trim()) return false;
			if (!data.endpoints || data.endpoints.length === 0) return false;
			return data.endpoints.every(ep => ep.path && ep.path.trim().length > 0);
		}

		if (step === 3) {
			const auth = data.auth;
			if (!auth) return false;

			switch (auth.type) {
				case "bearer":
					return (auth.value || "").trim().length > 0;
				case "apikey":
					return (auth.headerName || "").trim().length > 0 && (auth.value || "").trim().length > 0;
				case "basic":
					return (auth.username || "").trim().length > 0 && (auth.value || "").trim().length > 0;
				case "oauth2":
					return (
						(auth.clientId || "").trim().length > 0 &&
						(auth.value || "").trim().length > 0 &&
						(auth.tokenUrl || "").trim().length > 0
					);
				default:
					return true;
			}
		}

		return step === 4;
	};

	const handleNext = () => {
		setError(null);
		setStep((s) => Math.min(s + 1, 4));
	};

	const handleBack = () => {
		setError(null);
		setStep((s) => Math.max(s - 1, 1));
	};

	const handleSubmit = () => {
		if (!data.name.trim() || !hexValid) return;
		setError(null);
		startTransition(async () => {
			try {
				if (mode === "create") {
					await createProject(data);
					router.push("/");
				} else {
					if (initial?.id) {
						await updateProject(initial.id, data);
						router.push(`/projects/${initial.id}/import`);
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong.");
			}
		});
	};

	const handleTestConnection = () => {
		setTestStatus("testing");
		setTimeout(() => {
			const ok = data.baseUrl?.trim().startsWith("http") && (data.auth?.value || "").trim().length > 0;
			setTestStatus(ok ? "success" : "error");
		}, 1500);
	};

	const cancelAndExit = () => {
		if (mode === "edit" && initial?.id) {
			router.push(`/projects/${initial.id}/import`);
		} else {
			router.push("/");
		}
	};

	return (
		<div className="w-full">
			<div className="page-header flex items-center justify-between">
				<div>
					<h1 className="page-title">
						{mode === "create" ? "New Project" : "Edit Project"}
					</h1>
					<p className="page-subtitle">
						{mode === "create" ? "Configure your API connection step-by-step." : "Update your project settings."}
					</p>
				</div>
				<button type="button" onClick={cancelAndExit} className="btn btn-secondary btn-sm" aria-label="Cancel">
					Cancel
				</button>
			</div>

			<Stepper value={step} onValueChange={setStep}>
				<StepperNav className="mb-12">
					<StepperItem step={1}>
						<StepperTrigger className="flex-col items-center gap-1">
							<StepperIndicator>
								<span className="group-data-[state=completed]/step:hidden">1</span>
								<CheckIcon className="hidden group-data-[state=completed]/step:block" />
							</StepperIndicator>
							<StepperTitle>Info</StepperTitle>
						</StepperTrigger>
					</StepperItem>

					<StepperSeparator />

					<StepperItem step={2}>
						<StepperTrigger className="flex-col items-center gap-1">
							<StepperIndicator>
								<span className="group-data-[state=completed]/step:hidden">2</span>
								<CheckIcon className="hidden group-data-[state=completed]/step:block" />
							</StepperIndicator>
							<StepperTitle>API</StepperTitle>
						</StepperTrigger>
					</StepperItem>

					<StepperSeparator />

					<StepperItem step={3}>
						<StepperTrigger className="flex-col items-center gap-1">
							<StepperIndicator>
								<span className="group-data-[state=completed]/step:hidden">3</span>
								<CheckIcon className="hidden group-data-[state=completed]/step:block" />
							</StepperIndicator>
							<StepperTitle>Auth</StepperTitle>
						</StepperTrigger>
					</StepperItem>

					<StepperSeparator />

					<StepperItem step={4}>
						<StepperTrigger className="flex-col items-center gap-1">
							<StepperIndicator>
								<span className="group-data-[state=completed]/step:hidden">4</span>
								<CheckIcon className="hidden group-data-[state=completed]/step:block" />
							</StepperIndicator>
							<StepperTitle>Review</StepperTitle>
						</StepperTrigger>
					</StepperItem>
				</StepperNav>

				<div className="card pad min-h-[400px] flex flex-col pt-8 pb-6 px-7 border border-[var(--border)] relative">
					<div className="flex-1 flex flex-col gap-6">
						<StepperContent value={1} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-5">
							<h2 className="text-xl font-bold mb-1">Project Details</h2>
							<div>
								<span className="label text-sm mb-2 block">Name *</span>
								<input
									className="input w-full text-[15px] py-2.5"
									autoFocus
									value={data.name}
									onChange={(e) => setData({ ...data, name: e.target.value })}
									placeholder="e.g. Acme Analytics"
								/>
							</div>

							<div>
								<span className="label text-sm mb-2 block">Description (Optional)</span>
								<textarea
									className="textarea w-full text-[15px] min-h-[80px]"
									value={data.description}
									onChange={(e) => setData({ ...data, description: e.target.value })}
									placeholder="What is this project for?"
								/>
							</div>

							<div className="mt-2">
								<span className="label text-sm mb-3 block">Theme Color (Optional)</span>
								<div className="flex items-center gap-1.5 flex-wrap">
									{PRESET_COLORS.map((c) => {
										const selected = themeColor.toLowerCase() === c.value;
										return (
											<button
												key={c.value}
												type="button"
												onClick={() => {
													setData({ ...data, color: c.value });
													setPickerAnchor(null);
												}}
												title={c.label}
												aria-pressed={selected}
												className="w-8 h-8 rounded-full border-none cursor-pointer transition-transform hover:scale-110 active:scale-95"
												style={{
													background: c.value,
													boxShadow: selected ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.value}` : undefined,
												}}
											/>
										);
									})}

									<span className="w-px h-[24px] bg-[var(--border)] shrink-0 mx-2" aria-hidden />

									<button
										ref={customBtnRef}
										type="button"
										onClick={togglePicker}
										title="Custom color"
										className={cn(
											"w-8 h-8 rounded-full cursor-pointer inline-flex items-center justify-center transition-transform hover:scale-110 active:scale-95",
											!isCustomColor && "border border-dashed border-[var(--border-2)]"
										)}
										style={{
											background: isCustomColor ? themeColor : "transparent",
											color: isCustomColor ? "white" : "var(--text-3)",
											boxShadow: isCustomColor
												? `0 0 0 2px var(--surface), 0 0 0 4px ${themeColor}`
												: pickerAnchor
													? `0 0 0 2px var(--surface), 0 0 0 4px var(--accent)`
													: undefined,
										}}
									>
										{!isCustomColor && (
											<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
												<path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
											</svg>
										)}
									</button>
								</div>

								{pickerAnchor && (
									<ColorPickerPopover
										value={hexValid ? themeColor : "#0d74f6"}
										onChange={(c) => setData({ ...data, color: c })}
										onClose={() => setPickerAnchor(null)}
										anchor={pickerAnchor}
									/>
								)}
							</div>
						</StepperContent>

						<StepperContent value={2} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
							<h2 className="text-xl font-bold mb-1">API Endpoints</h2>

							<div>
								<span className="label text-sm mb-2 block">Base URL</span>
								<input
									className="input w-full text-[15px] py-2.5 font-mono"
									value={data.baseUrl}
									onChange={(e) => setData({ ...data, baseUrl: e.target.value })}
									placeholder="https://api.example.com/v1"
								/>
							</div>

							<div>
								<div className="flex justify-between items-end mb-3">
									<span className="label text-sm m-0">Endpoints</span>
									<button type="button" className="btn btn-secondary btn-sm" onClick={addEndpoint}>
										<PlusIcon /> Add Route
									</button>
								</div>

								<div className="flex flex-col gap-2">
									{(data.endpoints || []).map((ep) => (
										<div key={ep.id} className="group flex items-end gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--border-2)] hover:shadow-sm transition-all animate-in fade-in slide-in-from-left-2 duration-200">
											<div className="flex flex-col gap-1.5 w-[100px]">
												<span className="label !m-0 !text-[9px]">Method</span>
												<select
													className={cn(
														"select !py-1.5 font-mono text-[11px] font-bold uppercase",
														`method-${ep.method || "POST"}`
													)}
													value={ep.method || "POST"}
													onChange={(e) => handleEndpointChange(ep.id, "method", e.target.value)}
												>
													<option value="POST">POST</option>
													<option value="PUT">PUT</option>
													<option value="PATCH">PATCH</option>
												</select>
											</div>

											<div className="flex flex-col gap-1.5 flex-1">
												<span className="label !m-0 !text-[9px]">Path</span>
												<input
													className="input !py-1.5 font-mono text-[13px]"
													value={ep.path || ""}
													onChange={(e) => handleEndpointChange(ep.id, "path", e.target.value)}
													placeholder="/users"
												/>
											</div>

											<div className="flex flex-col gap-1.5 flex-1">
												<span className="label !m-0 !text-[9px]">Label</span>
												<input
													className="input !py-1.5 text-[13px]"
													value={ep.label || ""}
													onChange={(e) => handleEndpointChange(ep.id, "label", e.target.value)}
													placeholder="Fetch User List"
												/>
											</div>

											<button
												type="button"
												className="btn btn-ghost btn-icon !w-9 !h-9 text-[var(--danger)]/60 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg shrink-0 transition-colors"
												onClick={() => removeEndpoint(ep.id)}
												title="Remove endpoint"
											>
												<TrashIcon className="w-4 h-4" />
											</button>
										</div>
									))}
									{(!data.endpoints || data.endpoints.length === 0) && (
										<div className="p-4 text-center border-dashed border-2 border-[var(--border-2)] rounded-lg text-[var(--text-3)] text-[14px]">
											No endpoints configured.
										</div>
									)}
								</div>
							</div>
						</StepperContent>

						<StepperContent value={3} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-5">
							<h2 className="text-xl font-bold m-0">Authentication Setup</h2>

							<div>
								<span className="label text-sm mb-2 block">Auth Type</span>
								<select
									className="select w-full text-[15px] py-2.5"
									value={data.auth?.type || "bearer"}
									onChange={(e) => handleAuthChange("type", e.target.value)}
								>
									<option value="bearer">Bearer Token</option>
									<option value="apikey">API Key (Header)</option>
									<option value="basic">Basic Auth</option>
									<option value="oauth2">OAuth2 / Client Credentials</option>
								</select>
							</div>

							<div className="pt-2 flex flex-col gap-4">
								{(data.auth?.type === "bearer" || !data.auth?.type) && (
									<div className="flex flex-col gap-2">
										<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Bearer Token</span>
										<div className="group flex items-center relative h-11 transition-all">
											<span className="absolute left-3.5 text-[var(--text-3)] flex items-center h-full pointer-events-none group-focus-within:text-[var(--accent)] transition-colors">
												<LockIcon className="w-[15px] h-[15px]" />
											</span>
											<input
												className="input w-full h-full !pl-10 !pr-10 font-mono text-[13px] border-[var(--border)] focus:border-[var(--accent)] transition-all bg-[var(--surface)] rounded-lg"
												type={showSecret ? "text" : "password"}
												value={data.auth?.value || ""}
												onChange={(e) => handleAuthChange("value", e.target.value)}
												placeholder="eyJhbGciOiJIUzI1NiIs..."
											/>
											<button
												type="button"
												className="absolute right-2 px-2 h-full flex items-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
												onClick={() => setShowSecret(!showSecret)}
											>
												<EyeIcon off={showSecret} className="w-[18px] h-[18px]" />
											</button>
										</div>
									</div>
								)}

								{data.auth?.type === "apikey" && (
									<div className="flex flex-col gap-3">
										<div className="grid grid-cols-[140px_1fr] gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Header Name</span>
												<input
													className="input w-full h-11 font-mono text-[13px]"
													value={data.auth?.headerName || "X-API-Key"}
													onChange={(e) => handleAuthChange("headerName", e.target.value)}
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">API Key Value</span>
												<div className="group flex items-center relative h-11">
													<span className="absolute left-3.5 text-[var(--text-3)] flex items-center h-full pointer-events-none group-focus-within:text-[var(--accent)] transition-colors">
														<LockIcon className="w-[15px] h-[15px]" />
													</span>
													<input
														className="input w-full h-full !pl-10 !pr-10 font-mono text-[13px]"
														type={showSecret ? "text" : "password"}
														value={data.auth?.value || ""}
														onChange={(e) => handleAuthChange("value", e.target.value)}
													/>
													<button
														type="button"
														className="absolute right-2 px-2 h-full flex items-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
														onClick={() => setShowSecret(!showSecret)}
													>
														<EyeIcon off={showSecret} className="w-[18px] h-[18px]" />
													</button>
												</div>
											</div>
										</div>
									</div>
								)}

								{data.auth?.type === "basic" && (
									<div className="flex flex-col gap-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Username</span>
												<input
													className="input w-full h-11 text-[13px]"
													value={data.auth?.username || ""}
													onChange={(e) => handleAuthChange("username", e.target.value)}
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Password</span>
												<div className="group flex items-center relative h-11">
													<input
														className="input w-full h-full pr-11 text-[13px]"
														type={showSecret ? "text" : "password"}
														value={data.auth?.value || ""}
														onChange={(e) => handleAuthChange("value", e.target.value)}
													/>
													<button
														type="button"
														className="absolute right-2 px-2 h-full flex items-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
														onClick={() => setShowSecret(!showSecret)}
													>
														<EyeIcon off={showSecret} className="w-[18px] h-[18px]" />
													</button>
												</div>
											</div>
										</div>
									</div>
								)}

								{data.auth?.type === "oauth2" && (
									<div className="flex flex-col gap-4">
										<div className="grid grid-cols-[1fr_2fr] gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Client ID</span>
												<input
													className="input w-full h-11 text-[13px]"
													value={data.auth?.clientId || ""}
													onChange={(e) => handleAuthChange("clientId", e.target.value)}
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Client Secret</span>
												<div className="group flex items-center relative h-11">
													<input
														className="input w-full h-full pr-11 text-[13px]"
														type={showSecret ? "text" : "password"}
														value={data.auth?.value || ""}
														onChange={(e) => handleAuthChange("value", e.target.value)}
													/>
													<button
														type="button"
														className="absolute right-2 px-2 h-full flex items-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
														onClick={() => setShowSecret(!showSecret)}
													>
														<EyeIcon off={showSecret} className="w-[18px] h-[18px]" />
													</button>
												</div>
											</div>
										</div>
										<div className="flex flex-col gap-1.5">
											<span className="label !m-0 !text-[10px] !tracking-widest opacity-80">Token URL</span>
											<input
												className="input w-full h-11 text-[13px]"
												value={data.auth?.tokenUrl || ""}
												onChange={(e) => handleAuthChange("tokenUrl", e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="flex items-center gap-3 mt-2">
									<button
										type="button"
										className={cn(
											"btn btn-secondary h-9 px-4 transition-all",
											testStatus === "testing" && "opacity-70 cursor-not-allowed"
										)}
										onClick={handleTestConnection}
										disabled={!data.baseUrl || testStatus === "testing"}
									>
										{testStatus === "testing" ? (
											<svg className="animate-spin h-3.5 w-3.5 text-[var(--text-2)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										) : "Test Connection"}
									</button>
									{testStatus === "success" && (
										<div className="badge badge-ok animate-in zoom-in duration-200">
											<CheckIcon className="w-3 h-3 mr-1" />
											Connected
										</div>
									)}
									{testStatus === "error" && (
										<div className="badge badge-danger animate-in zoom-in duration-200">
											Failed to connect
										</div>
									)}
								</div>
							</div>
						</StepperContent>

						<StepperContent value={4} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
							<h2 className="text-xl font-bold mb-1">Review &amp; Finalize</h2>

							<div className="flex flex-col gap-4 border border-[var(--border)] rounded-lg p-5">
								<div className="flex items-start justify-between border-b border-[var(--border-2)] pb-4">
									<div>
										<div className="text-lg font-bold mb-1 flex items-center gap-2">
											<span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: themeColor }}></span>
											{data.name}
										</div>
										<div className="text-[var(--text-3)] text-sm">{data.description || "No description provided."}</div>
									</div>
									<button type="button" onClick={() => setStep(1)} className="btn btn-ghost btn-sm text-[var(--text-3)]">Edit</button>
								</div>

								<div className="flex items-start justify-between border-b border-[var(--border-2)] pb-4">
									<div>
										<div className="label mb-1">API Connections</div>
										<div className="text-sm">
											<span className="font-mono bg-[var(--surface-50)] px-1.5 py-0.5 rounded mr-2">{data.endpoints?.length}</span> Endpoints
										</div>
										{data.baseUrl && <div className="text-xs text-[var(--text-3)] font-mono mt-1 w-full truncate max-w-[280px]">Base: {data.baseUrl}</div>}
									</div>
									<button type="button" onClick={() => setStep(2)} className="btn btn-ghost btn-sm text-[var(--text-3)]">Edit</button>
								</div>

								<div className="flex items-start justify-between">
									<div>
										<div className="label mb-1">Authentication Layer</div>
										<span className="badge badge-accent uppercase text-[10px] tracking-wider font-semibold">
											{data.auth?.type || "bearer"}
										</span>
									</div>
									<button type="button" onClick={() => setStep(3)} className="btn btn-ghost btn-sm text-[var(--text-3)]">Edit</button>
								</div>
							</div>

							{error && (
								<div className="text-[13px] text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-3 py-2.5 rounded-[5px]">
									{error}
								</div>
							)}
						</StepperContent>
					</div>

					<div className="border-t border-[var(--border)] pt-5 mt-6 flex justify-between items-center">
						<button
							type="button"
							onClick={handleBack}
							className={cn("btn btn-secondary", step === 1 && "invisible")}
							disabled={isPending}
						>
							← Back
						</button>

						{step < 4 ? (
							<button
								type="button"
								onClick={handleNext}
								className="btn btn-primary px-6 shadow"
								disabled={!canGoNext()}
							>
								Continue →
							</button>
						) : (
							<button
								type="button"
								key="submit"
								className="btn btn-primary px-8 shadow"
								style={{ backgroundColor: themeColor }}
								onClick={handleSubmit}
								disabled={isPending || !canGoNext()}
							>
								{isPending
									? mode === "create" ? "Creating..." : "Saving..."
									: mode === "create" ? "Create Project" : "Save Changes"}
							</button>
						)}
					</div>
				</div>
			</Stepper>
		</div>
	);
}
