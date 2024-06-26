"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { messageSchema } from "@/schemas/messageSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ApiResponse } from "@/types/ApiResponse";
import { Separator } from "@/components/ui/separator";
import { useCompletion } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { suggestMessageSchema } from "@/schemas/suggestMessageSchema";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ModeToggle";

const specialChar = "||";

const parseStringMessage = (messageString: string): string[] => {
  return messageString.split(specialChar);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

function PublicProfile() {
  const params = useParams();
  const username = params.username;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    complete,
    completion,
    isLoading: isSuggestLoading,
    error,
  } = useCompletion({
    api: "/api/suggest-message",
    initialCompletion: initialMessageString,
  });

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const messageContent = form.watch("content");

  const handleClickChange = (message: string) => {
    form.setValue("content", message);
  };

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/send-message", {
        username,
        ...data,
      });

      toast({
        title: response?.data?.message,
      });
    } catch (error) {
      console.log("Error while sending message", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError?.response?.data?.message;

      toast({
        title: "Request failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestForm = useForm<z.infer<typeof suggestMessageSchema>>({
    resolver: zodResolver(suggestMessageSchema),
    defaultValues: {
      suggestMessage: "",
    },
  });

  const userMessage = suggestForm.watch("suggestMessage");

  const fetchMessagesFromAI = async (
    data: z.infer<typeof suggestMessageSchema>
  ) => {
    try {
      const { suggestMessage } = data;
      complete(suggestMessage);
    } catch (error) {
      console.log("Error while fetching suggest messages: ", error);
    }
  };

  return (
    <>
      <nav className="p-4 md:p-6 shadow-md dark:shadow-gray-600 text-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-end">
          <ModeToggle />
        </div>
      </nav>
      <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl  dark:bg-black">
        <h1 className="text-4xl text-center font-bold mb-4 dark:text-gray-300">
          Public Profile Link
        </h1>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 dark:text-gray-400">
            Send Anonymous Messages to @{username}
          </h2>{" "}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-6 "
            >
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Write your anonymous message here"
                        className="resize-none dark:text-gray-300 dark:border-gray-500 dark:border-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || !messageContent}
                  variant={"dark"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Send it"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        <div>
          <h1 className="text-2xl text-center font-bold mt-10 mb-4 dark:text-gray-400">
            Ask AI for messages
          </h1>
          <Form {...suggestForm}>
            <form
              onSubmit={suggestForm.handleSubmit(fetchMessagesFromAI)}
              className="space-y-6"
            >
              <FormField
                control={suggestForm.control}
                name="suggestMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-400">
                      Provide your message context to AI
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Write your message to AI"
                        className="resize-none dark:border-gray-500 dark:border-2 dark:text-gray-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-center">
                <Button
                  className="mb-4"
                  disabled={isSuggestLoading || !userMessage}
                  variant={"dark"}
                >
                  {isSuggestLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Suggest Message"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        <Separator className="dark:bg-gray-400" />
        <h2 className="mt-4 mb-4 dark:text-gray-400">
          Click on any message to select it
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-gray-400">Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            {error ? (
              <p className="text-red-500">{error.message}</p>
            ) : (
              parseStringMessage(completion).map((message, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="dark:bg-black dark:text-gray-300 dark:border-2 dark:border-gray-500 dark:hover:text-gray-200"
                  onClick={() => handleClickChange(message)}
                >
                  {message}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default PublicProfile;
