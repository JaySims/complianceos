"use client";

import {
  useEffect,
  useState,
} from "react";


type FrameworkCatalogueEntry = {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
};


type FrameworkCatalogueResponse = {
  success: true;
  entries: FrameworkCatalogueEntry[];
};


type FrameworkEstablishmentProps = {
  establishedFrameworkIds: string[];
  onEstablished: () => void | Promise<void>;
};


export default function FrameworkEstablishment({
  establishedFrameworkIds,
  onEstablished,
}: FrameworkEstablishmentProps) {
  const [catalogue, setCatalogue] =
    useState<FrameworkCatalogueEntry[]>([]);

  const [catalogueLoading, setCatalogueLoading] =
    useState(true);

  const [catalogueError, setCatalogueError] =
    useState<string | null>(null);

  const [selectedFrameworkId, setSelectedFrameworkId] =
    useState<string | null>(null);

  const [establishing, setEstablishing] =
    useState(false);

  const [establishmentError, setEstablishmentError] =
    useState<string | null>(null);

  const [establishmentMessage, setEstablishmentMessage] =
    useState<string | null>(null);

  const availableFrameworks =
    catalogue.filter(
      (entry) =>
        !establishedFrameworkIds.includes(
          entry.id
        )
    );

  const selectedFramework =
    selectedFrameworkId
      ? availableFrameworks.find(
          (entry) =>
            entry.id === selectedFrameworkId
        ) ?? null
      : null;


  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      setCatalogueLoading(true);
      setCatalogueError(null);

      try {
        const response =
          await fetch(
            "/api/compliance/framework-catalogue",
            {
              credentials: "include",
            }
          );

        const result =
          (await response.json()) as
            | FrameworkCatalogueResponse
            | {
                success: false;
                message?: string;
              };

        if (
          !response.ok ||
          !result.success ||
          !("entries" in result) ||
          !Array.isArray(result.entries)
        ) {
          throw new Error(
            !result.success && result.message
              ? result.message
              : "Unable to load compliance framework catalogue."
          );
        }

        if (!cancelled) {
          setCatalogue(
            result.entries
          );
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogue([]);
          setCatalogueError(
            error instanceof Error
              ? error.message
              : "Unable to load compliance framework catalogue."
          );
        }
      } finally {
        if (!cancelled) {
          setCatalogueLoading(false);
        }
      }
    }

    void loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    if (
      selectedFrameworkId &&
      (
        !catalogue.some(
          (entry) =>
            entry.id === selectedFrameworkId
        ) ||
        establishedFrameworkIds.includes(
          selectedFrameworkId
        )
      )
    ) {
      setSelectedFrameworkId(null);
    }
  }, [
    catalogue,
    establishedFrameworkIds,
    selectedFrameworkId,
  ]);


  async function establishFramework() {
    if (
      !selectedFramework ||
      establishing
    ) {
      return;
    }

    setEstablishing(true);
    setEstablishmentError(null);
    setEstablishmentMessage(null);

    try {
      const response =
        await fetch(
          "/api/compliance/frameworks",
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                frameworkId:
                  selectedFramework.id,
              }),
          }
        );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Compliance framework could not be established."
        );
      }

      setSelectedFrameworkId(null);

      await onEstablished();

      setEstablishmentMessage(
        `${selectedFramework.name} was established successfully.`
      );
    } catch (error) {
      setEstablishmentError(
        error instanceof Error
          ? error.message
          : "Compliance framework could not be established."
      );
    } finally {
      setEstablishing(false);
    }
  }


  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
          Framework Establishment
        </p>

        <h2 className="mt-3 text-2xl font-bold text-slate-900">
          Establish a compliance framework
        </h2>

        <p className="mt-2 text-slate-500">
          Add a governed compliance framework to this organisation&apos;s authoritative portfolio.
        </p>
      </div>

      {catalogueLoading ? (
        <p className="text-slate-500">
          Loading available compliance frameworks...
        </p>
      ) : catalogueError ? (
        <p className="text-red-600">
          {catalogueError}
        </p>
      ) : catalogue.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">
            No compliance frameworks are currently available for establishment.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            ComplianceOS will show frameworks here once they have passed regulatory review and controlled provisioning.
          </p>
        </div>
      ) : availableFrameworks.length === 0 ? (
        <p className="text-slate-500">
          All currently available compliance frameworks are already established for this organisation.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableFrameworks.map(
              (entry) => {
                const selected =
                  selectedFrameworkId ===
                  entry.id;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={establishing}
                    onClick={() => {
                      setSelectedFrameworkId(
                        entry.id
                      );
                      setEstablishmentError(
                        null
                      );
                      setEstablishmentMessage(
                        null
                      );
                    }}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block font-semibold">
                      {entry.name}
                    </span>

                    {entry.version && (
                      <span
                        className={`mt-1 block text-sm ${
                          selected
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        Version {entry.version}
                      </span>
                    )}

                    {entry.description && (
                      <span
                        className={`mt-3 block text-sm ${
                          selected
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        {entry.description}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          <button
            type="button"
            disabled={
              !selectedFramework ||
              establishing
            }
            onClick={() => {
              void establishFramework();
            }}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {establishing
              ? "Establishing framework..."
              : "Establish selected framework"}
          </button>
        </div>
      )}

      {establishmentError && (
        <p className="mt-4 text-red-600">
          {establishmentError}
        </p>
      )}

      {establishmentMessage && (
        <p className="mt-4 text-sm font-medium text-slate-700">
          {establishmentMessage}
        </p>
      )}
    </section>
  );
}