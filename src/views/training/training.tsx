import { apiRequest, jsonRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import type { Routine } from "../../api/types";
import RoutineForm, { type RoutineInput } from "./routine-form";

const Training = () => {
  const { showAlert } = useModal();

  const createRoutine = async (input: RoutineInput) => {
    const routine = await apiRequest<Routine>(
      "/api/v1/routines",
      jsonRequest("POST", input),
    );
    showAlert("success", `La rutina «${routine.name}» se ha creado correctamente.`);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Nueva rutina</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configura las repeticiones y el peso de cada serie.
        </p>
      </div>

      <RoutineForm
        onSubmit={createRoutine}
        submitLabel="Guardar rutina"
      />
    </section>
  );
};

export default Training;
