import { useState, useEffect } from "react";
import { 
  PlusIcon, 
  UserPlusIcon, 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  EyeIcon,
  TrashIcon,
  CheckCircleIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { getInitials, cn } from "@/lib/utils";
import { 
  getTestsList, 
  createTest, 
  updateTest, 
  deleteTest, 
  getApplications, 
  getStudentList, 
  getInternshipList, 
  assignTest,
  getTestAssignments
} from "@/lib/firebase";

// Test form schema
const testFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  questions: z.string().min(10, "Questions must be at least 10 characters"), // This would be a JSON string in real app
  duration: z.string().min(1, "Please specify duration"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

// Test assignment schema
const testAssignmentSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  internshipId: z.string().min(1, "Please select an internship"),
  testId: z.string().min(1, "Please select a test"),
});

type TestAssignmentValues = z.infer<typeof testAssignmentSchema>;

export default function ManageTests() {
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [testAssignments, setTestAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create test form
  const createTestForm = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: JSON.stringify([
        { id: 1, type: "mcq", question: "What is React?", options: ["A UI library", "A programming language", "A database", "An API"] },
        { id: 2, type: "text", question: "Explain the concept of state in React." }
      ], null, 2),
      duration: "60",
    },
  });
  
  // Assign test form
  const assignTestForm = useForm<TestAssignmentValues>({
    resolver: zodResolver(testAssignmentSchema),
    defaultValues: {
      studentId: "",
      internshipId: "",
      testId: "",
    },
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch tests
        const testsData = await getTestsList();
        setTests(testsData);
        
        // Fetch students, internships, applications, and test assignments
        const studentsData = await getStudentList();
        setStudents(studentsData);
        
        const internshipsData = await getInternshipList();
        setInternships(internshipsData);
        
        const applicationsData = await getApplications();
        setApplications(applicationsData);
        
        const assignmentsData = await getTestAssignments();
        setTestAssignments(assignmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "Failed to load tests and related data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Create a new test
  const handleCreateTest = async (data: TestFormValues) => {
    setIsSubmitting(true);
    try {
      const newTest = await createTest({
        title: data.title,
        description: data.description,
        questions: data.questions, // This would be a JSON string in real app
        duration: parseInt(data.duration),
      });
      
      // Add new test to the list
      setTests([...tests, { id: newTest.id, ...data }]);
      
      toast({
        title: "Test created",
        description: `${data.title} has been created successfully.`,
      });
      
      // Reset form and close dialog
      createTestForm.reset();
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating test:", error);
      toast({
        variant: "destructive",
        title: "Error creating test",
        description: "Failed to create test. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Assign a test to a student
  const handleAssignTest = async (data: TestAssignmentValues) => {
    setIsSubmitting(true);
    try {
      // Find the application that matches the student and internship
      const application = applications.find(app => 
        app.studentId === data.studentId && app.internshipId === data.internshipId
      );
      
      if (!application) {
        throw new Error("No application found for this student and internship");
      }
      
      // Assign the test
      const assignment = await assignTest({
        studentId: data.studentId,
        internshipId: data.internshipId,
        testId: data.testId,
        applicationId: application.id,
      });
      
      // Add the assignment to the list
      setTestAssignments([...testAssignments, {
        id: assignment.id,
        studentId: data.studentId,
        internshipId: data.internshipId,
        testId: data.testId,
        applicationId: application.id,
        status: "assigned",
      }]);
      
      toast({
        title: "Test assigned",
        description: "Test has been assigned successfully.",
      });
      
      // Reset form and close dialog
      assignTestForm.reset();
      setShowAssignForm(false);
    } catch (error: any) {
      console.error("Error assigning test:", error);
      toast({
        variant: "destructive",
        title: "Error assigning test",
        description: error.message || "Failed to assign test. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // View test details
  const handleViewTest = (test: any) => {
    setSelectedTest(test);
    setShowTestDetails(true);
  };
  
  // Delete a test
  const handleDeleteTest = async (id: string) => {
    try {
      await deleteTest(id);
      
      // Remove the test from the list
      setTests(tests.filter(test => test.id !== id));
      
      toast({
        title: "Test deleted",
        description: "Test has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting test:", error);
      toast({
        variant: "destructive",
        title: "Error deleting test",
        description: "Failed to delete test. Please try again.",
      });
    }
  };
  
  // Filter tests based on active tab
  const getFilteredTests = () => {
    switch (activeTab) {
      case "assigned":
        // Get test IDs that have been assigned
        const assignedTestIds = new Set(testAssignments.map(assignment => assignment.testId));
        return tests.filter(test => assignedTestIds.has(test.id));
        
      case "completed":
        // Get test IDs that have been completed
        const completedTestIds = new Set(
          testAssignments
            .filter(assignment => assignment.status === "completed")
            .map(assignment => assignment.testId)
        );
        return tests.filter(test => completedTestIds.has(test.id));
        
      case "pending":
        // Get test IDs that have been assigned but not completed
        const pendingTestIds = new Set(
          testAssignments
            .filter(assignment => assignment.status === "assigned")
            .map(assignment => assignment.testId)
        );
        return tests.filter(test => pendingTestIds.has(test.id));
        
      default:
        // All tests
        return tests;
    }
  };
  
  // Get student name by ID
  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id);
    return student ? student.name : "Unknown Student";
  };
  
  // Get internship title by ID
  const getInternshipTitle = (id: string) => {
    const internship = internships.find(i => i.id === id);
    return internship ? internship.title : "Unknown Internship";
  };
  
  // Get test title by ID
  const getTestTitle = (id: string) => {
    const test = tests.find(t => t.id === id);
    return test ? test.title : "Unknown Test";
  };
  
  // Format test questions for display
  const formatQuestions = (questionsJson: string) => {
    try {
      const questions = JSON.parse(questionsJson);
      return (
        <div className="space-y-3">
          {questions.map((q: any, index: number) => (
            <div key={q.id} className="border p-3 rounded-md">
              <p className="font-medium">Q{index + 1}: {q.question}</p>
              {q.type === "mcq" && (
                <ul className="mt-2 space-y-1">
                  {q.options.map((option: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {String.fromCharCode(65 + idx)}. {option}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === "text" && (
                <p className="mt-2 text-sm text-gray-600">
                  [Short answer/essay question]
                </p>
              )}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <p className="text-red-500">Error parsing questions</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Manage Tests</h1>
        <div className="flex gap-3">
          <Button 
            className="bg-primary hover:bg-indigo-700"
            onClick={() => setShowCreateForm(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Create New Test</span>
          </Button>
          <Button 
            className="bg-secondary hover:bg-violet-700"
            onClick={() => setShowAssignForm(true)}
          >
            <UserPlusIcon className="mr-2 h-4 w-4" />
            <span>Assign Test</span>
          </Button>
        </div>
      </div>
      
      {/* Test Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="all" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            All Tests
          </TabsTrigger>
          <TabsTrigger 
            value="assigned" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Assigned Tests
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Completed Tests
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Pending Evaluation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="pt-4">
          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <p className="col-span-full text-center py-8">Loading tests...</p>
            ) : getFilteredTests().length === 0 ? (
              <p className="col-span-full text-center py-8">No tests found for this category.</p>
            ) : (
              getFilteredTests().map((test) => (
                <Card key={test.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                  <CardHeader className="border-b p-5">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-heading font-semibold">{test.title}</CardTitle>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {test.status || "Active"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created on {new Date(test.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{test.duration} Minutes Duration</span>
                    </div>
                    
                    {/* Number of questions */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="17" x2="12" y2="17" />
                      </svg>
                      <span>
                        {(() => {
                          try {
                            const questions = JSON.parse(test.questions);
                            const mcqCount = questions.filter((q: any) => q.type === "mcq").length;
                            const textCount = questions.filter((q: any) => q.type === "text").length;
                            return `${questions.length} Questions (${mcqCount} MCQ, ${textCount} Subjective)`;
                          } catch (e) {
                            return "Questions unavailable";
                          }
                        })()}
                      </span>
                    </div>
                    
                    {/* Assignment status */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>
                        {(() => {
                          const assignmentsForTest = testAssignments.filter(a => a.testId === test.id);
                          return `Assigned to ${assignmentsForTest.length} students`;
                        })()}
                      </span>
                    </div>
                    
                    {/* Completion status */}
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>
                        {(() => {
                          const assignmentsForTest = testAssignments.filter(a => a.testId === test.id);
                          const completedCount = assignmentsForTest.filter(a => a.status === "completed").length;
                          const pendingCount = assignmentsForTest.length - completedCount;
                          return `${completedCount} Completed, ${pendingCount} Pending`;
                        })()}
                      </span>
                    </div>
                  </CardContent>
                  <div className="p-5 bg-gray-50 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-indigo-700"
                      onClick={() => handleViewTest(test)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span>View Details</span>
                    </Button>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-700 mr-3"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Test</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this test? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteTest(test.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          {/* Test Assignment Table for all tabs */}
          <Card className="mt-6">
            <CardHeader className="border-b px-5 py-4">
              <CardTitle className="font-heading font-semibold text-base">Recent Test Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead>Student</TableHead>
                      <TableHead>Internship</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No test assignments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      testAssignments.slice(0, 5).map((assignment) => (
                        <TableRow key={assignment.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                                <span>{getInitials(getStudentName(assignment.studentId))}</span>
                              </div>
                              <span className="font-medium">{getStudentName(assignment.studentId)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getInternshipTitle(assignment.internshipId)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getTestTitle(assignment.testId)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(assignment.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              assignment.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : assignment.status === "assigned"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            )}>
                              {assignment.status === "completed" 
                                ? "Completed" 
                                : assignment.status === "assigned"
                                ? "Not Started"
                                : "In Progress"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary hover:text-indigo-800 mr-3"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              {assignment.status === "completed" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-success hover:text-green-700"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-danger hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 text-center">
                <Button variant="link" className="text-primary hover:text-indigo-700">
                  View All Test Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Test Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              Create a new test for internship applicants.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createTestForm}>
            <form onSubmit={createTestForm.handleSubmit(handleCreateTest)} className="space-y-4">
              <FormField
                control={createTestForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Development Test" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this test will evaluate" 
                        {...field} 
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions (JSON format)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="min-h-[250px] font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Test"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Test Dialog */}
      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Test to Applicant</DialogTitle>
            <DialogDescription>
              Assign a test to a student who has applied for an internship.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assignTestForm}>
            <form onSubmit={assignTestForm.handleSubmit(handleAssignTest)} className="space-y-4">
              <FormField
                control={assignTestForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignTestForm.control}
                name="internshipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internship</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an internship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {internships.map(internship => (
                          <SelectItem key={internship.id} value={internship.id}>
                            {internship.title} at {internship.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignTestForm.control}
                name="testId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tests.map(test => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Assigning..." : "Assign Test"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Test Details Dialog */}
      <Dialog open={showTestDetails} onOpenChange={setShowTestDetails}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Test Details</DialogTitle>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedTest.title}</h3>
                <div className="flex items-center mt-1 space-x-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    {selectedTest.status || "Active"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedTest.duration} minutes
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm">{selectedTest.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Questions</h4>
                {formatQuestions(selectedTest.questions)}
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestDetails(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
