"use client";

import { UserPlus } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";

interface UnassignedExecutivesProps {
  executives: Pick<User, "id" | "fullName" | "email">[];
  onAssign?: (executive: Pick<User, "id" | "fullName" | "email">) => void;
}

export function UnassignedExecutives({ executives, onAssign }: UnassignedExecutivesProps) {
  if (executives.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title={`Unassigned Executives (${executives.length})`}
        subtitle="Sales executives not assigned to any manager"
      />
      <CardBody>
        <div className="space-y-3">
          {executives.map((exec) => (
            <div
              key={exec.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={exec.fullName} size="sm" />
                <div>
                  <p className="font-medium text-slate-900">{exec.fullName}</p>
                  <p className="text-xs text-slate-500">{exec.email}</p>
                </div>
              </div>
              {onAssign && (
                <Button
                  onClick={() => onAssign(exec)}
                  size="sm"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign to Team
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
