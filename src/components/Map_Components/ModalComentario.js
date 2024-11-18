import React, { useState } from "react";

const ModalComentario = ({ visible, onClose }) => {
	const [distanciaLocal, setDistanciaLocal] = useState("");
	const [colorLocal, setColorLocal] = useState("yellow");
	const [comentarioLocal, setComentarioLocal] = useState("");
	const [error, setError] = useState(false);
	const [textError, setTextError] = useState("");

	const closeModal = (confirmed = false) => {
		if (confirmed) {
			// Pasar los datos al componente padre cuando confirma
			onClose({
				confirmed: true,
				data: {
					distancia: distanciaLocal * 1000,
					color: colorLocal,
					comentario: comentarioLocal,
				},
			});
		} else {
			// Si cancela, enviamos confirmed: false
			onClose({
				confirmed: false,
				data: null,
			});
		}

		// Limpiar el formulario
		setDistanciaLocal("");
		setColorLocal("");
		setComentarioLocal("");
		setError(false);
		setTextError("");
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!distanciaLocal || !colorLocal || !comentarioLocal) {
			setError(true);
			setTextError("Todos los campos son obligatorios.");
			return;
		}
		closeModal(true);
	};

	return (
		<div
			className={`modal modalComentario fade ${visible ? "show" : ""}`}
			style={{ display: visible ? "block" : "none" }}
			id="crearPozo"
			data-bs-backdrop="static"
			tabIndex="-1"
			aria-labelledby="crearPozoLabel"
			aria-hidden="true"
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5" id="crearPozoLabel">
							Crear pozo
						</h1>
						<button
							type="button"
							className="btn-close"
							onClick={() => closeModal(false)}
						></button>
					</div>
					<div className="modal-body">
						<form onSubmit={handleSubmit}>
							{error && (
								<div className="alert alert-danger">
									{textError}
								</div>
							)}
							<div className="form-group mb-3">
								<label htmlFor="distanciaPozo">
									Distancia (km)
								</label>
								<input
									type="number"
									min="1"
									pattern="[0-9]+([\.][0-9]+)?"
									step={"0.01"}
									inputMode="decimal"
									value={distanciaLocal}
									onChange={(e) =>
										setDistanciaLocal(e.target.value)
									}
									className="form-control"
									id="distanciaPozo"
									placeholder="Ingresa la distancia del pozo"
								/>
							</div>
							<div className="form-group mb-3">
								<label htmlFor="colorPozo">
									Color de alerta
								</label>
								<select
									value={colorLocal}
									required={false}
									onChange={(e) => setColorLocal(e.target.value)}
									className="form-select"
									id="colorPozo"
									placeholder="Ingresa color de alerta"
								>
									<option value={"yellow"}>Amarillo</option>
									<option value={"red"}>Rojo</option>
								</select>
							</div>
							<div className="form-group mb-3">
								<label htmlFor="comentarioPozo">
									Comentario
								</label>
								<textarea
									value={comentarioLocal}
									onChange={(e) =>
										setComentarioLocal(e.target.value)
									}
									className="form-control"
									id="comentarioPozo"
									rows="3"
									placeholder="Ingrese el comentario del pozo"
								></textarea>
							</div>
						</form>
					</div>
					<div className="modal-footer">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={() => closeModal(false)}
						>
							Cancelar
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleSubmit}
						>
							Guardar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModalComentario;
