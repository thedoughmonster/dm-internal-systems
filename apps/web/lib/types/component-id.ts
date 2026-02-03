export type ComponentIdProps = {
  id: string
}

export type RequireId<T> = T & ComponentIdProps
