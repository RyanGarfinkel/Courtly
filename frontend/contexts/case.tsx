'use client';

import { createContext, useContext } from "react";
import { Case } from "@/types/case";

const CaseContext = createContext<Case | null>(null);

export function CaseProvider({ case_, children }: { case_: Case; children: React.ReactNode })
{
	return <CaseContext.Provider value={case_}>{children}</CaseContext.Provider>;
}

export function useCase(): Case
{
	const c = useContext(CaseContext);
	if(!c) throw new Error("useCase must be used within a CaseProvider");
	return c;
}
