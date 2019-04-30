import { ExecaReturns, shellSync } from "execa";

export enum ProcessState {
	Online = "online",
	Stopped = "stopped",
	Stopping = "stopping",
	Waiting = "waiting restart",
	Launching = "launching",
	Errored = "errored",
	OneLaunch = "one-launch-status",
}

export type ProcessIdentifier = string | number;
export type ProcessDescription = Record<string, any>;

export class Foreman {
	public list(): ProcessDescription[] | undefined {
		try {
			const { stdout } = shellSync("pm2 jlist");

			const lastLine: string | undefined = stdout.split("\n").pop();

			if (!lastLine) {
				return undefined;
			}

			return Object.values(JSON.parse(lastLine));
		} catch (error) {
			return undefined;
		}
	}

	public describe(id: ProcessIdentifier): ProcessDescription | undefined {
		try {
			const processes: ProcessDescription[] | undefined = this.list();

			return processes
				? processes.find((process: ProcessDescription) => [process.id, process.name].includes(id))
				: undefined;
		} catch (error) {
			return undefined;
		}
	}

	public start(opts: Record<string, any>, flags: string[] = []): ExecaReturns {
		let command: string = `pm2 start ${opts.script} ${flags.join(" ")} `;

		if (opts.args) {
			command += ` -- ${opts.args}`;
		}

		return shellSync(command);
	}

	public stop(id: ProcessIdentifier, flags: string[] = []): ExecaReturns {
		return shellSync(`pm2 stop ${id} ${flags.join(" ")}`);
	}

	public restart(id: ProcessIdentifier, flags: string[] = []): ExecaReturns {
		return shellSync(`pm2 restart ${id} ${flags.join(" ")}`);
	}

	public reload(id: ProcessIdentifier): ExecaReturns {
		return shellSync(`pm2 reload ${id}`);
	}

	public reset(id: ProcessIdentifier): ExecaReturns {
		return shellSync(`pm2 reset ${id}`);
	}

	public delete(id: ProcessIdentifier): ExecaReturns {
		return shellSync(`pm2 delete ${id}`);
	}

	public flush(): ExecaReturns {
		return shellSync("pm2 flush");
	}

	public reloadLogs(): ExecaReturns {
		return shellSync("pm2 reloadLogs");
	}

	public ping(): ExecaReturns {
		return shellSync("pm2 ping");
	}

	public update(): ExecaReturns {
		return shellSync("pm2 update");
	}

	public status(id: ProcessIdentifier): ProcessState | undefined {
		try {
			const process: ProcessDescription | undefined = this.describe(id);

			return process ? process.pm2_env.status : undefined;
		} catch (error) {
			return undefined;
		}
	}

	public isOnline(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Online;
	}

	public isStopped(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Stopped;
	}

	public isStopping(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Stopping;
	}

	public isWaiting(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Waiting;
	}

	public isLaunching(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Launching;
	}

	public isErrored(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.Errored;
	}

	public isOneLaunch(id: ProcessIdentifier): boolean {
		return this.status(id) === ProcessState.OneLaunch;
	}

	public isUnknown(id: ProcessIdentifier): boolean {
		return !Object.values(ProcessState).includes(this.status(id));
	}

	public has(id: ProcessIdentifier): boolean {
		try {
			const { stdout } = shellSync(`pm2 id ${id} | awk '{ print $2 }'`);

			return !!stdout;
		} catch (error) {
			return false;
		}
	}

	public missing(id: ProcessIdentifier): boolean {
		return !this.has(id);
	}
}
