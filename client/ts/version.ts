/** Version representation */
interface Version {
    uuid: string;
    counter: number;
    pending: number[];
}

/**
 * Version vector representation.
 *
 * Version vector is used to record operations received from each client in
 * the editing session. Versions prevent a delete operation from being
 * applied prior to the corresponding insert operation.
 */
export class VersionVector {
    public localVersion: Version;
    public remoteVersions: Map<string, Version>;

    public constructor(uuid: string) {
        this.localVersion = {
            uuid: uuid,
            counter: 0,
            pending: []
        };
        this.remoteVersions = new Map<string, Version>();
    }

    /** Get current local version */
    public getLocalVersion(): Version {
        return this.localVersion;
    }

    /** Increment current local version */
    public updateLocalVersion(): void {
        this.localVersion.counter++;
    }

    /**
     * Determine if version committed.
     *
     * A version has been committed if the corresponding insert operation
     * has been applied.
     *
     * @param version - version corresponding to character
     */
    public committed(version: Version): boolean {
        if (version.uuid == this.localVersion.uuid) {
            return true;
        }
        const remoteVersion = this.remoteVersions.get(version.uuid);
        if (remoteVersion === undefined) {
            return false;
        }
        return version.counter <= remoteVersion.counter && !remoteVersion.pending.includes(version.counter);
    }

    /**
     * Update remote versions.
     *
     * Each version is associated to an insert operation. Local metadata
     * associated to each client must be updated upon receiving an insert
     * operation.
     *
     * @param updateVersion - version used to update remote versions
     */
    public updateRemoteVersion(updateVersion: Version): void {
        const remoteVersion = this.remoteVersions.get(updateVersion.uuid);
        if (remoteVersion === undefined) {
            // create version
            const newVersion = {
                uuid: updateVersion.uuid,
                counter: 0,
                pending: []
            };
            this.updateVersion(newVersion, updateVersion);
            this.remoteVersions.set(newVersion.uuid, newVersion);
        } else {
            // update current version
            this.updateVersion(remoteVersion, updateVersion);
        }
    }

    /* Update `version` based on `updateVersion` */
    private updateVersion(version: Version, updateVersion: Version): void {
        if (updateVersion.counter <= version.counter) {
            // remove version counter from pending
            const index = version.pending.indexOf(updateVersion.counter);
            if (index !== -1) {
                version.pending.splice(index, 1);
            }
        } else {
            // add version counters to pending
            for (let i = version.counter + 1; i < updateVersion.counter; i++) {
                version.pending.push(i);
            }
            version.counter = updateVersion.counter;
        }
    }
}
