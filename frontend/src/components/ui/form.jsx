import * as React from "react";
import {cn} from "@/utils/functions";
import {Slot} from "@radix-ui/react-slot";
import {Label} from "@/components/ui/label";
import {Controller, FormProvider, useFormContext} from "react-hook-form";


const Form = FormProvider;

const FormFieldContext = React.createContext({});

const FormItemContext = React.createContext({});


const FormField = ({ ...props }) => {
    return (
        (<FormFieldContext value={{ name: props.name }}>
            <Controller {...props}/>
        </FormFieldContext>)
    );
};


const useFormField = () => {
    const fieldContext = React.use(FormFieldContext);
    const itemContext = React.use(FormItemContext);
    const { getFieldState, formState } = useFormContext();
    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};


const FormItem = (
    {
        ref,
        className,
        ...props
    }
) => {
    const id = React.useId();

    return (
        (<FormItemContext value={{ id }}>
            <div ref={ref} className={cn("space-y-2", className)} {...props}/>
        </FormItemContext>)
    );
};
FormItem.displayName = "FormItem";


const FormLabel = (
    {
        ref,
        className,
        ...props
    }
) => {
    const { formItemId } = useFormField();

    return (
        <Label
            ref={ref}
            className={className}
            htmlFor={formItemId}
            {...props}
        />
    );
};
FormLabel.displayName = "FormLabel";


const FormControl = (
    {
        ref,
        ...props
    }
) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
            aria-invalid={!!error}
            className={error && "border-destructive"}
            {...props}
        />
    );
};
FormControl.displayName = "FormControl";


const FormDescription = (
    {
        ref,
        className,
        ...props
    }
) => {
    const { formDescriptionId } = useFormField();

    return (
        <p
            ref={ref}
            id={formDescriptionId}
            className={cn("text-[0.8rem] text-muted-foreground", className)}
            {...props}
        />
    );
};
FormDescription.displayName = "FormDescription";


const FormMessage = (
    {
        ref,
        className,
        children,
        ...props
    }
) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) return null;

    return (
        <p
            ref={ref}
            id={formMessageId}
            className={cn("text-[0.8rem] font-medium text-destructive", className)}
            {...props}>
            {body}
        </p>
    );
};
FormMessage.displayName = "FormMessage";


export {
    useFormField,
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
};
