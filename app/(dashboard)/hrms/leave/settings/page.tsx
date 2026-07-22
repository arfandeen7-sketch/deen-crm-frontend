"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLeaveTypes } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveTypeList } from "@/components/leave/LeaveTypeList";
import { LeaveTypeFormDialog } from "@/components/leave/LeaveTypeFormDialog";
import type { LeaveTypeConfig } from "@/types";

export default function HrLeaveSettingsPage() {
  const { canAction } = useAuth();
  const { data: types, isLoading } = useLeaveTypes(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editType, setEditType] = useState<LeaveTypeConfig | null>(null);

  const canManage = canAction("hrms", "leave", "manage_types");

  const handleEdit = (type: LeaveTypeConfig) => {
    setEditType(type);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditType(null);
    setFormOpen(true);
  };

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Settings"
          subtitle="Configure leave types and their rules"
          actions={
            canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4" /> Add Leave Type
              </Button>
            )
          }
        />

        <Card>
          <CardBody className="pt-0">
            <LeaveTypeList
              types={types ?? []}
              loading={isLoading}
              onEdit={handleEdit}
            />
          </CardBody>
        </Card>

        {canManage && (
          <LeaveTypeFormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            editType={editType}
          />
        )}
      </div>
    </AccessGuard>
  );
}
