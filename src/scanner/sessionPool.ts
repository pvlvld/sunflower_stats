class SessionPool {
    private _pool: Map<number, { data: { id: number; session: string }; status: "free" | "bussy" }>;

    constructor(sessions: string[]) {
        this._pool = new Map();

        for (let i = 0; i < sessions.length; i++) {
            this._pool.set(i, { data: { id: i, session: sessions[i] }, status: "free" });
        }
    }

    public get() {
        for (const [, session] of this._pool) {
            if (session.status === "free") {
                session.status = "bussy";
                return session.data;
            }
        }

        return undefined;
    }

    public release(id: number) {
        if (this._pool.has(id)) {
            this._pool.get(id)!.status = "free";
        } else {
            throw new Error("Unknown session id!");
        }
    }
}
//TODO: make sessions storage
const sessionPool = new SessionPool(["russia-is-a-terrorist-state", "russia-is-a-terrorist-state"]);
export { sessionPool };
