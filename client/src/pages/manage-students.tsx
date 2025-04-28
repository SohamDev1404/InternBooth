import { useState, useEffect } from "react";
import { 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  PauseCircleIcon, 
  PlayCircleIcon, 
  TrashIcon 
} from "lucide-react";
import { 
  Card, 
  CardContent 
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
import { getStudentList, updateStudent, deleteStudent, handleFirebaseError } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Student form schema
const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  course: z.string().min(1, "Please enter a course/branch"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function ManageStudents() {
  const { toast } = useToast();
  const [studentList, setStudentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      course: "",
    },
  });

  // Fetch student list
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const students = await getStudentList();
        setStudentList(students);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          variant: "destructive",
          title: "Error fetching students",
          description: "Failed to load student list. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [toast]);
  
  // Handle form submission
  const onSubmit = async (data: StudentFormValues) => {
    setIsUpdating(true);
    try {
      if (editingStudent) {
        // Update existing student
        await updateStudent(editingStudent.id, {
          name: data.name,
          email: data.email,
          course: data.course,
        });
        
        // Update local state
        setStudentList(studentList.map(student => 
          student.id === editingStudent.id ? 
          { ...student, name: data.name, email: data.email, course: data.course } : 
          student
        ));
        
        toast({
          title: "Student updated",
          description: `${data.name}'s account has been updated successfully.`,
        });
        
        // Reset form and close dialog
        form.reset();
        setShowForm(false);
        setEditingStudent(null);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        variant: "destructive",
        title: "Error updating student",
        description: "Failed to update student account. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle edit student
  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      email: student.email,
      course: student.course,
    });
    setShowForm(true);
  };
  
  // Handle toggle student status
  const handleToggleStatus = async (student: any) => {
    try {
      const newStatus = student.status === "active" ? "inactive" : "active";
      await updateStudent(student.id, { status: newStatus });
      
      // Update local state
      setStudentList(studentList.map(s => 
        s.id === student.id ? { ...s, status: newStatus } : s
      ));
      
      toast({
        title: "Status updated",
        description: `${student.name}'s status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating student status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Failed to update student status. Please try again.",
      });
    }
  };
  
  // Handle delete student
  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      
      // Update local state
      setStudentList(studentList.filter(student => student.id !== id));
      
      toast({
        title: "Student deleted",
        description: "Student account has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        variant: "destructive",
        title: "Error deleting student",
        description: "Failed to delete student account. Please try again.",
      });
    }
  };
  
  // Filter student list
  const filteredStudents = studentList.filter(student => {
    const matchesSearch = 
      (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCourse = !courseFilter || courseFilter === "all" || student.course === courseFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });
  
  // Apply filters
  const handleApplyFilters = () => {
    // Just use the current filter state values
    toast({
      title: "Filters applied",
      description: "Student list has been filtered.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Manage Students</h1>
      </div>
      
      {/* Student Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Student Account</DialogTitle>
            <DialogDescription>
              Update student details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course/Branch</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course or branch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Student"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Student Filter and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs font-medium text-gray-700 mb-1">Search</Label>
            <div className="relative">
              <Input
                type="text"
                className="pl-10"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
            </div>
          </div>
          
          <div className="w-40">
            <Label className="text-xs font-medium text-gray-700 mb-1">Course/Branch</Label>
            <Select
              value={courseFilter}
              onValueChange={setCourseFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <Label className="text-xs font-medium text-gray-700 mb-1">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40 flex items-end">
            <Button
              variant="outline"
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
              onClick={handleApplyFilters}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              <span>Apply Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Student Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course/Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading student data...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No students found. {searchTerm || courseFilter || statusFilter ? "Try adjusting your filters." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                          <span>{getInitials(student.name || "Student")}</span>
                        </div>
                        <span className="font-medium">{student.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{student.email || "No email"}</TableCell>
                    <TableCell className="text-sm">{student.course || "Not specified"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        student.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {student.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-indigo-800"
                          onClick={() => handleEditStudent(student)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className={student.status === "active" 
                            ? "text-warning hover:text-yellow-700" 
                            : "text-success hover:text-green-700"}
                          onClick={() => handleToggleStatus(student)}
                        >
                          {student.status === "active" ? (
                            <PauseCircleIcon className="h-4 w-4" />
                          ) : (
                            <PlayCircleIcon className="h-4 w-4" />
                          )}
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
                              <AlertDialogTitle>Delete Student Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.name || "this student"}'s account? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredStudents.length}</span> of <span className="font-medium">{studentList.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white border-primary">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
