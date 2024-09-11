type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type FixBooleanProperties<T> = {
    [P in keyof T]: T[P] extends boolean ? boolean : T[P];
};

export { Writeable, FixBooleanProperties };
