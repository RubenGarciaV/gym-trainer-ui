import { useNavigate } from "react-router-dom";
import { apiRequest, jsonRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import type { Routine } from "../../api/types";
import RoutineForm, { type RoutineInput } from "./routine-form";

const Training = () => {
  const navigate = useNavigate();
  const { showAlert } = useModal();

  const createRoutine = async (input: RoutineInput) => {
    const routine = await apiRequest<Routine>(
      "/api/v1/routines",
      jsonRequest("POST", input),
    );
    showAlert("success", `La rutina «${routine.name}» se ha creado correctamente.`);
    navigate("/workouts");
  };

  return (
    <section className="page-shell mx-auto max-w-3xl space-y-5">
      <div className="page-heading">
        <p className="page-eyebrow">Diseña tu plan</p>
        <h1 className="page-title">Nueva rutina</h1>
        <p className="page-description">
          Elige ejercicios y configura las series, el peso y los descansos.
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
