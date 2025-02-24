
const secrets: string[] = []

export function addSecret(secret: string) {
    secrets.push(secret)
}

export function scrubSecrets(value: string, replacement: string = "[REDACTED]") {
    secrets.forEach(secret => value = value.split(secret).join(replacement))
    return value
}

